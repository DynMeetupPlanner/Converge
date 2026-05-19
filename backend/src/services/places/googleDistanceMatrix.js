// ─────────────────────────────────────────────────────────────────────────────
// googleDistanceMatrix.js
//
// PHASE 1 & 3: Real route-aware travel times via Google Distance Matrix API.
//
// Design decisions:
//   • Two-stage filtering: cheap haversine pre-filter → matrix only on top 15.
//     This keeps API costs manageable (N users × 15 places vs N × 100+).
//   • Traffic-aware: departure_time=now + traffic_model=best_guess.
//   • Per-mode support: driving, walking, transit.
//   • In-memory cache keyed on sorted origin+dest pairs — avoids redundant calls
//     within the same server process lifetime (5-min TTL).
//   • Graceful fallback: if matrix call fails we return haversine estimates so
//     the rest of the pipeline never crashes.
// ─────────────────────────────────────────────────────────────────────────────

const MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const MATRIX_CACHE_TTL_MS = 1000 * 60 * 5;  // 5 min — traffic changes, don't over-cache
const MATRIX_MAX_CANDIDATES = 15;            // PHASE 7: never run matrix on >15 places
const matrixCache = new Map();

const EARTH_RADIUS_KM = 6371;

// Fallback speeds when Matrix API is unavailable
const FALLBACK_SPEED_KMPH = { driving: 28, walking: 4.5, transit: 18 };
const FALLBACK_ROAD_FACTOR = { driving: 1.35, walking: 1.15, transit: 1.45 };

// ─── Internal helpers ─────────────────────────────────────────────────────────

function toRad(v) { return (v * Math.PI) / 180; }

function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function fallbackEstimate(originCoords, destCoords, mode = 'driving') {
  const speed = FALLBACK_SPEED_KMPH[mode] || FALLBACK_SPEED_KMPH.driving;
  const factor = FALLBACK_ROAD_FACTOR[mode] || FALLBACK_ROAD_FACTOR.driving;
  const distanceKm = haversineKm(originCoords, destCoords) * factor;
  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.max(1, Math.round((distanceKm / speed) * 60)),
    source: 'haversine-fallback',
  };
}

function coordString(coord) {
  return `${Number(coord.latitude).toFixed(6)},${Number(coord.longitude).toFixed(6)}`;
}

function makeCacheKey(origins, destinations, mode) {
  const o = origins.map(coordString).sort().join('|');
  const d = destinations.map(coordString).sort().join('|');
  return `${mode}::${o}::${d}`;
}

// ─── Core Matrix fetcher ──────────────────────────────────────────────────────

/**
 * Calls Google Distance Matrix for a batch of origins × destinations.
 * Returns a 2D array: rows = origins, cols = destinations.
 * Each cell: { distanceKm, durationMinutes, source }
 */
async function fetchMatrixBatch({ origins, destinations, mode, apiKey, debug }) {
  const cacheKey = makeCacheKey(origins, destinations, mode);
  const cached = matrixCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < MATRIX_CACHE_TTL_MS) {
    debug.matrixCacheHits = (debug.matrixCacheHits || 0) + 1;
    return cached.value;
  }

  const originsStr = origins.map(coordString).join('|');
  const destsStr = destinations.map(coordString).join('|');

  const params = new URLSearchParams({
    key: apiKey,
    origins: originsStr,
    destinations: destsStr,
    mode,
    units: 'metric',
  });

  // Traffic awareness — only meaningful for driving
  if (mode === 'driving') {
    params.set('departure_time', 'now');
    params.set('traffic_model', 'best_guess');
  }

  const url = `${MATRIX_URL}?${params.toString()}`;
  debug.matrixRequests = debug.matrixRequests || [];

  let httpStatus, responseOk, bodyText;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    httpStatus = res.status;
    responseOk = res.ok;
    bodyText = await res.text();
  } catch (err) {
    debug.matrixRequests.push({ url: url.replace(apiKey, 'KEY'), error: String(err) });
    return null; // triggers fallback
  }

  debug.matrixRequests.push({
    url: url.replace(apiKey, 'KEY'),
    origins: origins.length,
    destinations: destinations.length,
    mode,
    httpStatus,
  });

  if (!responseOk) return null;

  let data;
  try { data = JSON.parse(bodyText); } catch { return null; }
  if (!['OK'].includes(data.status)) {
    debug.matrixErrors = debug.matrixErrors || [];
    debug.matrixErrors.push(`Matrix status ${data.status}: ${data.error_message || ''}`);
    return null;
  }

  // Parse rows → 2D result array
  const rows = data.rows || [];
  const result = rows.map((row, ri) =>
    (row.elements || []).map((el, ci) => {
      if (el.status !== 'OK') {
        // Element-level failure: fall back individually
        return fallbackEstimate(origins[ri], destinations[ci], mode);
      }
      // Prefer duration_in_traffic when available (driving+traffic)
      const seconds = el.duration_in_traffic?.value ?? el.duration?.value ?? 0;
      const meters = el.distance?.value ?? 0;
      return {
        distanceKm: Number((meters / 1000).toFixed(2)),
        durationMinutes: Math.max(1, Math.round(seconds / 60)),
        source: el.duration_in_traffic ? 'google-traffic' : 'google',
      };
    })
  );

  matrixCache.set(cacheKey, { at: Date.now(), value: result });
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * PHASE 1+3: Compute real travel times from every user to every candidate place.
 *
 * PHASE 7 two-stage filtering:
 *   Stage 1 — haversine sort, keep top MATRIX_MAX_CANDIDATES per user centroid
 *   Stage 2 — run Matrix API only on those candidates
 *
 * Returns:
 *   Map<placeId, Map<userId, { distanceKm, durationMinutes, source }>>
 *
 * Falls back to haversine estimates if API key is missing or call fails.
 */
export async function computeTravelMatrix({ users, candidates, mode = 'driving', debug }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // same key — Distance Matrix is on same project
  debug.matrixEnabled = Boolean(apiKey);
  debug.matrixMode = mode;
  debug.usedGoogleMatrix = false;

  // Build user origin coords
  const origins = users
    .filter((u) => Number.isFinite(u.location?.latitude) && Number.isFinite(u.location?.longitude))
    .map((u) => ({
      userId: u.userId,
      name: u.name,
      coords: { latitude: u.location.latitude, longitude: u.location.longitude },
      travelMode: u.travelMode || mode,
    }));

  if (!origins.length || !candidates.length) {
    return new Map();
  }

  // PHASE 7 Stage 1: pre-filter candidates by haversine to centroid of all users
  // so we don't waste matrix quota on far-away places
  const centroid = {
    latitude: origins.reduce((s, o) => s + o.coords.latitude, 0) / origins.length,
    longitude: origins.reduce((s, o) => s + o.coords.longitude, 0) / origins.length,
  };

  const scored = candidates.map((place) => {
    const [lng, lat] = place.location?.coordinates || [];
    const placeCoords = { latitude: lat, longitude: lng };
    return { place, approxKm: haversineKm(centroid, placeCoords) };
  });
  scored.sort((a, b) => a.approxKm - b.approxKm);
  const top = scored.slice(0, MATRIX_MAX_CANDIDATES).map((s) => s.place);

  debug.matrixCandidatesIn = candidates.length;
  debug.matrixCandidatesAfterPrefilter = top.length;

  // Build destination coords
  const destinations = top.map((place) => {
    const [lng, lat] = place.location?.coordinates || [];
    return { placeId: place._id, coords: { latitude: lat, longitude: lng } };
  });

  const destCoords = destinations.map((d) => d.coords);

  // PHASE 7 Stage 2: run matrix (grouped by mode if users have different modes)
  const modeGroups = {};
  for (const origin of origins) {
    const m = origin.travelMode || mode;
    if (!modeGroups[m]) modeGroups[m] = [];
    modeGroups[m].push(origin);
  }

  // result[placeId][userId] = { distanceKm, durationMinutes, source }
  const result = new Map(top.map((p) => [p._id, new Map()]));

  for (const [m, groupOrigins] of Object.entries(modeGroups)) {
    let matrixRows = null;

    if (apiKey) {
      matrixRows = await fetchMatrixBatch({
        origins: groupOrigins.map((o) => o.coords),
        destinations: destCoords,
        mode: m,
        apiKey,
        debug,
      });
    }

    if (matrixRows) {
    debug.usedGoogleMatrix = true;
    }
    for (let oi = 0; oi < groupOrigins.length; oi++) {
      const origin = groupOrigins[oi];
      for (let di = 0; di < destinations.length; di++) {
        const dest = destinations[di];
        const estimate = matrixRows?.[oi]?.[di]
          ?? fallbackEstimate(origin.coords, dest.coords, m);

        result.get(dest.placeId).set(origin.userId, {
          userId: origin.userId,
          name: origin.name,
          mode: m,
          ...estimate,
        });
      }
    }
  }

  debug.matrixResultPlaces = result.size;
  return result;
}

// Re-export haversine for use in other modules
export { haversineKm };
