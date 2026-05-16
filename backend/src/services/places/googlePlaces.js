const GOOGLE_PLACES_NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const NEARBY_CACHE_TTL_MS = 1000 * 60 * 5;
const nearbyCache = new Map();

function clampRadiusMeters(radiusKm) {
  const meters = Number(radiusKm) * 1000;
  if (!Number.isFinite(meters)) return 5000;
  return Math.max(100, Math.min(50000, meters));
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(name) {
  const stop = new Set(['the', 'and', 'of', 'restaurant', 'cafe', 'bar', 'pub', 'hotel', 'dine', 'eatery', 'kitchen']);
  return normalizeName(name)
    .split(' ')
    .filter((t) => t && t.length >= 2 && !stop.has(t));
}

function tokenJaccard(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function priceLevelToBucket(priceLevel) {
  const lvl = Number(priceLevel);
  if (!Number.isFinite(lvl) || lvl < 0) return 'unknown';
  if (lvl <= 1) return 'budget';
  if (lvl === 2) return 'moderate';
  return 'premium';
}

async function fetchGoogleNearbyRestaurants({ lat, lng, radiusKm, apiKey }) {
  const cacheKey = `${Math.round(Number(lat) * 1000) / 1000},${Math.round(Number(lng) * 1000) / 1000},${Math.round(Number(radiusKm) * 10) / 10}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < NEARBY_CACHE_TTL_MS) return cached.value;

  const radiusMeters = clampRadiusMeters(radiusKm);
  const params = new URLSearchParams({
    key: apiKey,
    location: `${Number(lat)},${Number(lng)}`,
    radius: String(radiusMeters),
    type: 'restaurant',
  });

  const results = [];
  let pageToken = null;

  for (let page = 0; page < 3; page += 1) {
    if (pageToken) params.set('pagetoken', pageToken);
    const url = `${GOOGLE_PLACES_NEARBY_URL}?${params.toString()}`;

    // Note: Google may require a short delay before pagetoken becomes active.
    if (pageToken) await new Promise((r) => setTimeout(r, 1800));

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const bodyText = await response.text();
    if (!response.ok) throw new Error(`Google Places nearbysearch error ${response.status}: ${bodyText.slice(0, 200)}`);

    const data = JSON.parse(bodyText);
    const pageResults = Array.isArray(data.results) ? data.results : [];
    for (const item of pageResults) {
      const glat = item?.geometry?.location?.lat;
      const glng = item?.geometry?.location?.lng;
      if (!Number.isFinite(glat) || !Number.isFinite(glng)) continue;
      results.push({
        placeId: item.place_id,
        name: item.name,
        lat: glat,
        lng: glng,
        rating: Number.isFinite(item.rating) ? item.rating : null,
        userRatingsTotal: Number.isFinite(item.user_ratings_total) ? item.user_ratings_total : null,
        priceLevel: Number.isFinite(item.price_level) ? item.price_level : null,
      });
    }

    pageToken = data.next_page_token || null;
    if (!pageToken) break;
  }

  nearbyCache.set(cacheKey, { at: Date.now(), value: results });
  return results;
}

function pickBestGoogleMatch(osmPlace, googleCandidates) {
  const [olng, olat] = osmPlace?.location?.coordinates || [];
  if (!Number.isFinite(olat) || !Number.isFinite(olng)) return null;
  const osmTokens = tokenize(osmPlace.name);

  let best = null;
  let bestScore = -Infinity;

  for (const cand of googleCandidates) {
    const dist = haversineMeters(olat, olng, cand.lat, cand.lng);
    if (dist > 175) continue;
    const sim = tokenJaccard(osmTokens, tokenize(cand.name));
    const score = (sim * 10) - (dist / 50);
    if (score > bestScore) {
      bestScore = score;
      best = { ...cand, distanceMeters: dist, nameSimilarity: sim };
    }
  }

  if (!best) return null;
  if (best.nameSimilarity < 0.34 && best.distanceMeters > 60) return null;
  return best;
}

export async function enrichPlacesWithGoogleIfNeeded({ places, lat, lng, radiusKm }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return places;

  const onlyRestaurants = places.filter((p) => p?.category === 'restaurant');
  if (!onlyRestaurants.length) return places;

  const googleRestaurants = await fetchGoogleNearbyRestaurants({
    lat,
    lng,
    radiusKm,
    apiKey,
  });

  if (!googleRestaurants.length) return places;

  const enrichedIds = new Set();

  for (const p of onlyRestaurants) {
    // Skip if already enriched from a provider.
    if (p?.ratingSource === 'google' && (Number.isFinite(p.rating) || p.priceLevel)) continue;

    const match = pickBestGoogleMatch(p, googleRestaurants);
    if (!match) continue;

    p.googlePlaceId = match.placeId;
    if (Number.isFinite(match.rating)) {
      p.rating = match.rating;
      p.ratingSource = 'google';
    }
    if (Number.isFinite(match.userRatingsTotal)) p.userRatingsTotal = match.userRatingsTotal;

    p.priceLevel = priceLevelToBucket(match.priceLevel);

    enrichedIds.add(p._id);
  }

  // Keep return value stable (original array objects mutated above)
  return places;
}
