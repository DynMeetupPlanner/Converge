const GOOGLE_PLACES_NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const NEARBY_CACHE_TTL_MS = 1000 * 60 * 5;
const NEARBY_MAX_PAGES = 1;
const nearbyCache = new Map();

const GOOGLE_TYPE_BY_CATEGORY = {
  cafe: 'cafe',
  restaurant: 'restaurant',
  park: 'park',
  mall: 'shopping_mall',
  bar: 'bar',
};

const CATEGORY_BY_GOOGLE_TYPE = Object.fromEntries(
  Object.entries(GOOGLE_TYPE_BY_CATEGORY).map(([category, googleType]) => [googleType, category])
);

// ─── Semantic exclusion lists ─────────────────────────────────────────────────
// FIX 1: Removed clothing_store, shoe_store, electronics_store from mall list.
// Real malls carry those types as secondary tags — excluding them killed valid results.
// Only exclude types that are NEVER part of a real mall destination.

const EXCLUDED_TYPES_BY_CATEGORY = {
  mall: [
    'furniture_store',
    'hardware_store',
    'home_goods_store',
    'storage',
    'car_repair',
    'car_dealer',
    'bicycle_store',
    'plumber',
    'electrician',
    'general_contractor',
    'moving_company',
  ],
  restaurant: [
    'gas_station',
    'car_wash',
    'lodging',
  ],
  cafe: [
    'gas_station',
    'car_wash',
  ],
  bar: [
    'gas_station',
  ],
  park: [],
};

// ─── Keyword heuristics ───────────────────────────────────────────────────────

const POSITIVE_KEYWORDS_BY_CATEGORY = {
  mall: ['mall', 'plaza', 'center', 'centre', 'galleria', 'arcade', 'market', 'square', 'hub'],
  restaurant: [],
  cafe: ['cafe', 'coffee', 'brew', 'roast', 'bistro', 'bakery'],
  bar: ['bar', 'pub', 'lounge', 'brewery', 'taproom', 'tavern'],
  park: ['park', 'garden', 'lake', 'reserve', 'trail', 'green'],
};

const NEGATIVE_KEYWORDS_BY_CATEGORY = {
  mall: ['furniture', 'hardware', 'electrical', 'tiles', 'plywood', 'timber', 'lumber', 'spare parts', 'motors', 'tyres', 'tires'],
  restaurant: [],
  cafe: [],
  bar: [],
  park: [],
};

// FIX 5: Chain penalty list. These brands dominate on review count but are
// poor meetup destinations — too transactional, no ambience, no novelty.
// We penalise in scoring rather than filtering: if nothing better exists, they still show.
const CHAIN_NAMES = [
  'starbucks', "mcdonald's", 'mcdonalds', "domino's", 'dominos',
  'kfc', 'subway', 'burger king', 'pizza hut', 'taco bell',
  'dunkin', 'costa coffee', 'cafe coffee day', 'ccd',
  'baskin robbins', 'haldirams', 'barbeque nation',
];

// ─── Dynamic popularity thresholds ───────────────────────────────────────────
// FIX 2: Static thresholds broke smaller cities. Threshold now scales with
// search radius — tight radius = lower bar (fewer options); wide = stricter.

function getDynamicMinRatings(category, radiusKm) {
  const r = Number(radiusKm) || 5;
  switch (category) {
    case 'mall':
      if (r <= 3) return 50;
      if (r <= 8) return 120;
      return 200;
    case 'restaurant':
      if (r <= 3) return 10;
      if (r <= 8) return 25;
      return 40;
    case 'cafe':
      if (r <= 3) return 8;
      if (r <= 8) return 15;
      return 25;
    case 'bar':
      if (r <= 3) return 8;
      if (r <= 8) return 15;
      return 25;
    case 'park':
      return 5;
    default:
      return 0;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampRadiusMeters(radiusKm) {
  const meters = Number(radiusKm) * 1000;
  if (!Number.isFinite(meters)) return 5000;
  return Math.max(100, Math.min(12000, meters));
}

function priceLevelToBucket(priceLevel) {
  const lvl = Number(priceLevel);
  if (!Number.isFinite(lvl) || lvl < 0) return 'unknown';
  if (lvl <= 1) return 'budget';
  if (lvl === 2) return 'moderate';
  return 'premium';
}

function sanitizeGoogleUrl(url, apiKey) {
  return url.replace(apiKey, 'GOOGLE_PLACES_API_KEY');
}

function isChain(name) {
  const lower = (name || '').toLowerCase();
  return CHAIN_NAMES.some((chain) => lower.includes(chain));
}

/**
 * Hard filter: returns true if this place should be rejected entirely.
 * Applies type exclusions, keyword exclusions, and dynamic popularity floor.
 */
function isJunkResult(place, category, radiusKm) {
  const types = place.types || [];
  const nameLower = (place.name || '').toLowerCase();

  const excludedTypes = EXCLUDED_TYPES_BY_CATEGORY[category] || [];
  if (excludedTypes.some((t) => types.includes(t))) return true;

  const negativeKeywords = NEGATIVE_KEYWORDS_BY_CATEGORY[category] || [];
  if (negativeKeywords.some((kw) => nameLower.includes(kw))) return true;

  const minRatings = getDynamicMinRatings(category, radiusKm);
  if ((place.userRatingsTotal || 0) < minRatings) return true;

  return false;
}

// ─── FIX 7: Temporal context scoring ─────────────────────────────────────────
// Venue types have strong time-of-day preferences. This makes recommendations
// feel contextually intelligent rather than time-blind.

function getTemporalBoost(category) {
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const isMorning   = hour >= 6  && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening   = hour >= 17 && hour < 21;
  const isNight     = hour >= 21 || hour < 4;

  switch (category) {
    case 'cafe':
      if (isMorning)   return 15;
      if (isAfternoon) return 8;
      if (isEvening)   return 3;
      return -5;
    case 'bar':
      if (isNight)     return 15;
      if (isEvening)   return 12;
      if (isAfternoon) return 2;
      return -8;
    case 'park':
      if (isNight)     return -15;
      if (isMorning)   return 12;
      if (isAfternoon) return 10;
      return 5;
    case 'mall':
      if (isNight)     return -10;
      if (isWeekend)   return 10;
      return 5;
    case 'restaurant':
      if (isMorning)   return -3;
      if (isAfternoon) return 10;
      if (isEvening)   return 12;
      if (isNight)     return 5;
      return 0;
    default:
      return 0;
  }
}

// ─── FIX 3: Graduated keyword scoring ────────────────────────────────────────
// Was binary 0/1. Now 5 pts per matching keyword so multi-signal names
// (e.g. "Phoenix Marketcity Mall") score higher than single-signal names.

function getKeywordBoost(place, category) {
  const nameLower = (place.name || '').toLowerCase();
  const positiveKeywords = POSITIVE_KEYWORDS_BY_CATEGORY[category] || [];
  if (positiveKeywords.length === 0) return 0;
  const matchCount = positiveKeywords.filter((kw) => nameLower.includes(kw)).length;
  return matchCount * 5;
}

/**
 * Social suitability score (composite).
 * Combines: popularity, rating quality, open-now, category anchor,
 * keyword name signals, temporal context, chain penalty.
 *
 * Used for pre-sorting before the meetup fairness ranker runs.
 * Your ranker should incorporate this as ~30% of its final score.
 * Suggested weights: fairness 35%, travel 20%, rating 15%, social 30%.
 */
function getSocialScore(place, category, radiusKm) {
  let score = 0;

  // Popularity — strongest objective signal
  const reviews = place.userRatingsTotal || 0;
  if (reviews > 5000)      score += 35;
  else if (reviews > 2000) score += 30;
  else if (reviews > 500)  score += 20;
  else if (reviews > 100)  score += 10;

  // Rating quality
  if (place.rating >= 4.5)      score += 20;
  else if (place.rating >= 4.2) score += 15;
  else if (place.rating >= 4.0) score += 8;

  // Open right now
  if (place.openNow === true) score += 10;

  // Category anchor bonus
  if (category === 'mall')       score += 8;
  if (category === 'restaurant') score += 5;

  // Keyword name bonus (FIX 3 — graduated)
  score += getKeywordBoost(place, category);

  // Temporal context (FIX 7)
  score += getTemporalBoost(category);

  // Chain penalty (FIX 5) — soft suppression, not a hard filter
  if (isChain(place.name)) score -= 10;

  return score;
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

async function fetchGoogleNearbyByType({ lat, lng, radiusKm, apiKey, googleType, debug }) {
  const cacheKey = `${googleType}:${Math.round(Number(lat) * 1000) / 1000},${Math.round(Number(lng) * 1000) / 1000},${Math.round(Number(radiusKm) * 10) / 10}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < NEARBY_CACHE_TTL_MS) {
    debug.googleRequests.push({
      type: googleType,
      fromMemoryCache: true,
      resultCount: cached.value.length,
      ratingsReturned: cached.value.filter((item) => Number.isFinite(item.rating)).length,
    });
    return cached.value;
  }

  const radiusMeters = clampRadiusMeters(radiusKm);
  const params = new URLSearchParams({
    key: apiKey,
    location: `${Number(lat)},${Number(lng)}`,
    radius: String(radiusMeters),
    type: googleType,
  });

  const results = [];
  let pageToken = null;

  for (let page = 0; page < NEARBY_MAX_PAGES; page += 1) {
    if (pageToken) params.set('pagetoken', pageToken);
    const url = `${GOOGLE_PLACES_NEARBY_URL}?${params.toString()}`;
    const requestDebug = {
      type: googleType,
      page: page + 1,
      url: sanitizeGoogleUrl(url, apiKey),
      fromMemoryCache: false,
    };

    if (pageToken) await new Promise((r) => setTimeout(r, 2500));

    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const bodyText = await response.text();
    requestDebug.httpStatus = response.status;
    if (!response.ok) {
      requestDebug.error = bodyText.slice(0, 240);
      debug.googleRequests.push(requestDebug);
      throw new Error(`Google Places nearbysearch error ${response.status}: ${bodyText.slice(0, 200)}`);
    }

    const data = JSON.parse(bodyText);
    requestDebug.googleStatus = data.status || null;
    requestDebug.errorMessage = data.error_message || null;
    requestDebug.resultCount = Array.isArray(data.results) ? data.results.length : 0;
    requestDebug.ratingsReturned = Array.isArray(data.results)
      ? data.results.filter((item) => Number.isFinite(item.rating)).length
      : 0;
    debug.googleRequests.push(requestDebug);

    if (pageToken && data.status === 'INVALID_REQUEST') {
      debug.googleWarnings = debug.googleWarnings || [];
      debug.googleWarnings.push(`Google page ${page + 1} token was not ready; using earlier page results.`);
      break;
    }

    if (data.status && !['OK', 'ZERO_RESULTS'].includes(data.status)) {
      throw new Error(`Google Places ${googleType} status ${data.status}: ${data.error_message || 'no error message'}`);
    }

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
        vicinity: item.vicinity,
        openNow: typeof item.opening_hours?.open_now === 'boolean' ? item.opening_hours.open_now : null,
        businessStatus: item.business_status,
        types: Array.isArray(item.types) ? item.types : [],
        primaryType: item.types?.[0] || null,
      });
    }

    pageToken = data.next_page_token || null;
    if (!pageToken) break;
  }

  nearbyCache.set(cacheKey, { at: Date.now(), value: results });
  return results;
}

// ─── Normalization ────────────────────────────────────────────────────────────

function normalizeGooglePlace(item, category, radiusKm) {
  return {
    _id: `google-${item.placeId}`,
    externalId: `google-${item.placeId}`,
    source: 'google',
    googlePlaceId: item.placeId,
    name: item.name,
    category,
    rating: Number.isFinite(item.rating) ? item.rating : null,
    ratingSource: Number.isFinite(item.rating) ? 'google' : null,
    userRatingsTotal: Number.isFinite(item.userRatingsTotal) ? item.userRatingsTotal : null,
    priceLevel: priceLevelToBucket(item.priceLevel),
    vicinity: item.vicinity,
    openNow: item.openNow,
    businessStatus: item.businessStatus,
    types: item.types,
    primaryType: item.primaryType,
    isChain: isChain(item.name),
    socialScore: getSocialScore(item, category, radiusKm),
    location: {
      coordinates: [item.lng, item.lat],
    },
  };
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function fetchNearbyPlacesGoogle({ lat, lng, radiusKm, category = 'all', debug }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  debug.googleEnabled = Boolean(apiKey);
  debug.googleDirect = true;
  debug.googleRequests = debug.googleRequests || [];
  debug.googleErrors = debug.googleErrors || [];
  debug.googleCategoryTypes = GOOGLE_TYPE_BY_CATEGORY;
  debug.filteredCount = 0; // FIX 8: counter not string array — avoids log bloat

  if (!apiKey) {
    debug.googleErrors.push('GOOGLE_PLACES_API_KEY is missing on backend');
    return [];
  }

  const googleTypes = category && category !== 'all'
    ? [GOOGLE_TYPE_BY_CATEGORY[category]].filter(Boolean)
    : Object.values(GOOGLE_TYPE_BY_CATEGORY);

  debug.categoriesRequested = category && category !== 'all'
    ? [category]
    : Object.keys(GOOGLE_TYPE_BY_CATEGORY);
  debug.googleTypesRequested = googleTypes;
  debug.googleFetchMode = 'parallel-by-type';
  debug.googleMaxPagesPerType = NEARBY_MAX_PAGES;

  const typeResultPairs = await Promise.all(googleTypes.map(async (googleType) => {
    const candidates = await fetchGoogleNearbyByType({
      lat,
      lng,
      radiusKm,
      apiKey,
      googleType,
      debug,
    });
    return { googleType, candidates };
  }));

  const byPlaceId = new Map();
  for (const { googleType, candidates } of typeResultPairs) {
    const mappedCategory = CATEGORY_BY_GOOGLE_TYPE[googleType] || category || 'restaurant';

    for (const candidate of candidates) {
      if (!candidate.placeId) continue;
      if (byPlaceId.has(candidate.placeId)) continue;

      if (isJunkResult(candidate, mappedCategory, radiusKm)) {
        debug.filteredCount += 1; // FIX 8: count, don't log every name
        continue;
      }

      byPlaceId.set(candidate.placeId, normalizeGooglePlace(candidate, mappedCategory, radiusKm));
    }
  }

  const places = [...byPlaceId.values()];

  // Pre-sort by socialScore so your meetup ranker starts from the best candidates.
  // Suggested final weights: fairness 35%, travel 20%, rating 15%, social 30%.
  places.sort((a, b) => (b.socialScore ?? 0) - (a.socialScore ?? 0));

  debug.inputPlaceCount = places.length;
  debug.outputRatedPlaceCount = places.filter((place) => Number.isFinite(place.rating)).length;
  debug.outputGoogleRatedPlaceCount = places.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length;
  return places;
}
