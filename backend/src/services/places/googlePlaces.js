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

function clampRadiusMeters(radiusKm) {
  const meters = Number(radiusKm) * 1000;
  if (!Number.isFinite(meters)) return 5000;
  return Math.max(100, Math.min(50000, meters));
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

    // Google next_page_token can take a moment to activate.
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
      });
    }

    pageToken = data.next_page_token || null;
    if (!pageToken) break;
  }

  nearbyCache.set(cacheKey, { at: Date.now(), value: results });
  return results;
}

function normalizeGooglePlace(item, category) {
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
    location: {
      coordinates: [item.lng, item.lat],
    },
  };
}

export async function fetchNearbyPlacesGoogle({ lat, lng, radiusKm, category = 'all', debug }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  debug.googleEnabled = Boolean(apiKey);
  debug.googleDirect = true;
  debug.googleRequests = debug.googleRequests || [];
  debug.googleErrors = debug.googleErrors || [];
  debug.googleCategoryTypes = GOOGLE_TYPE_BY_CATEGORY;

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
      if (!byPlaceId.has(candidate.placeId)) {
        byPlaceId.set(candidate.placeId, normalizeGooglePlace(candidate, mappedCategory));
      }
    }
  }

  const places = [...byPlaceId.values()];
  debug.inputPlaceCount = places.length;
  debug.outputRatedPlaceCount = places.filter((place) => Number.isFinite(place.rating)).length;
  debug.outputGoogleRatedPlaceCount = places.filter((place) => place.ratingSource === 'google' && Number.isFinite(place.rating)).length;
  return places;
}
