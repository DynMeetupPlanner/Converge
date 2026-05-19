// ─── meetingPlanner.js ────────────────────────────────────────────────────────
// Complete rewrite.
//
// KEY CHANGES FROM ORIGINAL:
//  - haversine * ROAD_FACTOR estimation REPLACED by real Google Distance Matrix
//  - Centroid is now SEARCH ANCHOR only, not optimization center
//  - Bounding-box candidate search replaces centroid-only search
//  - Fairness formula: normalized max/variance/avg (academically sound)
//  - Pareto-optimal set computed alongside ranked list
//  - Two-stage cost control: cheap filter → DM API on top-15 only
//  - Haversine kept as FALLBACK when DM API unavailable/fails per-place

import { computeTravelMatrix } from './googleDistanceMatrix.js';

const EARTH_RADIUS_KM = 6371;

// Fallback speeds (only used when Google DM is unavailable)
const FALLBACK_SPEED_KMPH = { walking: 4.5, driving: 28, transit: 18 };
const FALLBACK_ROAD_FACTOR = { walking: 1.15, driving: 1.35, transit: 1.45 };

// How many candidates to send to the Distance Matrix (Phase 7 cost control)
const DM_CANDIDATE_LIMIT = 15;

// Final output cap
const TOP_PLACE_LIMIT = 20;

// ─── Math helpers ─────────────────────────────────────────────────────────────

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ─── Phase 5: Centroid is search anchor only ──────────────────────────────────

export function calculateCentroid(members) {
  const located = members.filter((m) =>
    Number.isFinite(m.location?.latitude) && Number.isFinite(m.location?.longitude)
  );
  if (!located.length) return null;
  return {
    latitude: located.reduce((s, m) => s + m.location.latitude, 0) / located.length,
    longitude: located.reduce((s, m) => s + m.location.longitude, 0) / located.length,
  };
}

// ─── Phase 6: Bounding box for search region ─────────────────────────────────

export function calculateBoundingBox(members, bufferKm = 2) {
  const located = members.filter((m) =>
    Number.isFinite(m.location?.latitude) && Number.isFinite(m.location?.longitude)
  );
  if (!located.length) return null;

  const lats = located.map((m) => m.location.latitude);
  const lngs = located.map((m) => m.location.longitude);

  // Convert buffer km to degrees (rough approximation, good enough for search)
  const bufLat = bufferKm / 111;
  const bufLng = bufferKm / (111 * Math.cos(toRad(lats.reduce((s, v) => s + v, 0) / lats.length)));

  return {
    minLat: Math.min(...lats) - bufLat,
    maxLat: Math.max(...lats) + bufLat,
    minLng: Math.min(...lngs) - bufLng,
    maxLng: Math.max(...lngs) + bufLng,
    centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
    centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    // Radius from center to corner + buffer — used for Places API search radius
    radiusKm: (() => {
      const center = {
        latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
        longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      };
      const corner = { latitude: Math.max(...lats), longitude: Math.max(...lngs) };
      return haversineKm(center, corner) + bufferKm;
    })(),
  };
}

// ─── Fallback travel estimator (haversine, no API) ───────────────────────────

function estimateTravelFallback(member, placeCoords, requestedMode) {
  const mode = requestedMode || member.travelMode || 'driving';
  const speed = FALLBACK_SPEED_KMPH[mode] || FALLBACK_SPEED_KMPH.driving;
  const factor = FALLBACK_ROAD_FACTOR[mode] || FALLBACK_ROAD_FACTOR.driving;
  const straightKm = haversineKm(member.location, placeCoords);
  const distanceKm = straightKm * factor;

  return {
    userId: member.userId,
    name: member.name,
    mode,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.max(1, Math.round((distanceKm / speed) * 60)),
    source: 'haversine-fallback',
  };
}

// ─── Phase 4 & 12: Academic fairness formula ─────────────────────────────────
//
// Old formula: 100 - arbitrary penalties  (academically weak)
// New formula: normalized combination of max, variance, average
//   - max travel: most important (minimize the worst case)
//   - variance: fairness of distribution
//   - average: overall group burden
// All components normalized to [0, 1] then inverted to score [0, 100].

function computeFairnessMetrics(durations) {
  const n = durations.length;
  if (!n) return { max: 0, min: 0, avg: 0, variance: 0, fairnessScore: 0 };

  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const avg = durations.reduce((s, v) => s + v, 0) / n;
  const variance = durations.reduce((s, v) => s + (v - avg) ** 2, 0) / n;

  return { max, min, avg, variance };
}

function normalizeFairnessScore(metrics, allMetrics) {
  // Normalize each metric relative to max observed across all candidates
  // so scores are comparable within this result set
  const { max: placeMax, avg: placeAvg, variance: placeVar } = metrics;

  const globalMaxMax = Math.max(...allMetrics.map((m) => m.max), 1);
  const globalMaxAvg = Math.max(...allMetrics.map((m) => m.avg), 1);
  const globalMaxVar = Math.max(...allMetrics.map((m) => m.variance), 1);

  const normMax = 1 - placeMax / globalMaxMax;       // lower max = better
  const normAvg = 1 - placeAvg / globalMaxAvg;       // lower avg = better
  const normVar = 1 - placeVar / globalMaxVar;       // lower var = better (more fair)

  // Weights: minimize max travel (45%), minimize variance/unfairness (30%), minimize avg (25%)
  const rawScore = (normMax * 0.45) + (normVar * 0.30) + (normAvg * 0.25);
  return Math.max(0, Math.min(100, Math.round(rawScore * 100)));
}

// ─── Phase 13: Pareto optimality ─────────────────────────────────────────────
// A place is Pareto-optimal if no other place is strictly better on ALL criteria.
// Criteria: lower max travel, lower variance, better social score.

function computeParetoFront(scoredPlaces) {
  return scoredPlaces.filter((a) => {
    const dominated = scoredPlaces.some((b) => {
      if (b.placeId === a.placeId) return false;

      return (
        b.travelStats.maxMinutes <= a.travelStats.maxMinutes &&
        b.travelStats.varianceMinutes <= a.travelStats.varianceMinutes &&
        (b.socialScore || 0) >= (a.socialScore || 0) &&
        (
          b.travelStats.maxMinutes < a.travelStats.maxMinutes ||
          b.travelStats.varianceMinutes < a.travelStats.varianceMinutes ||
          (b.socialScore || 0) > (a.socialScore || 0)
        )
      );
    });

    return !dominated;
  });
}

// ─── Phase 15: Effective midpoint ────────────────────────────────────────────
// Route-based midpoint = place with minimum max(travel_time).
// This is the TRUE fair midpoint, as distinct from the geometric centroid.

export function computeEffectiveMidpoint(scoredPlaces) {
  if (!scoredPlaces.length) return null;
  const best = scoredPlaces.reduce((a, b) =>
    a.travelStats.maxMinutes <= b.travelStats.maxMinutes ? a : b
  );
  return {
    latitude: best.location.latitude,
    longitude: best.location.longitude,
    placeId: best.placeId,
    placeName: best.name,
    maxTravelMinutes: best.travelStats.maxMinutes,
    avgTravelMinutes: best.travelStats.averageMinutes,
  };
}

// ─── Normalization ────────────────────────────────────────────────────────────

function normalizePlace(place) {
  const [longitude, latitude] = place.location?.coordinates || [];
  return {
    placeId: place._id,
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    category: place.category,
    rating: place.rating ?? null,
    ratingSource: place.ratingSource || null,
    userRatingsTotal: place.userRatingsTotal ?? null,
    priceLevel: place.priceLevel || 'unknown',
    vicinity: place.vicinity,
    openingHours: place.openingHours,
    phone: place.phone,
    website: place.website,
    openNow: typeof place.openNow === 'boolean' ? place.openNow : null,
    businessStatus: place.businessStatus,
    types: place.types || [],
    socialScore: place.socialScore ?? 0,
    isChain: place.isChain || false,
    location: { latitude, longitude },
    links: buildPlaceLinks({ name: place.name, latitude, longitude }),
  };
}

export function buildPlaceLinks({ name, latitude, longitude }) {
  const q = encodeURIComponent(`${name} ${latitude},${longitude}`);
  const search = encodeURIComponent(name);
  return {
    maps: `https://www.google.com/maps/search/?api=1&query=${q}`,
    zomato: `https://www.zomato.com/search?q=${search}`,
    swiggy: `https://www.swiggy.com/search?query=${search}`,
  };
}

function isOpenNow(place) {
  if (typeof place.openNow === 'boolean') return place.openNow;
  if (place.openingHours === '24/7') return true;
  return null;
}

function passesFilters(place, filters) {
  if (filters.minRating && place.rating && place.rating < filters.minRating) return false;
  if (filters.priceLevel && filters.priceLevel !== 'any' && place.priceLevel !== filters.priceLevel) return false;
  if (filters.openNow && isOpenNow(place) === false) return false;
  return true;
}

function buildReason({ fairnessScore, travelStats, place, isRealRouting, isPareto }) {
  const avg = Math.round(travelStats.averageMinutes);
  const max = travelStats.maxMinutes;
  const source = isRealRouting ? 'real route data' : 'estimated travel';
  const ratingText = place.rating
    ? `rated ${Number(place.rating).toFixed(1)} ★`
    : 'no rating';
  const paretoTag = isPareto ? ' Pareto-optimal choice.' : '';
  const chainTag = place.isChain ? ' (chain venue)' : '';
  return `Fairness ${fairnessScore}/100 · avg ${avg} min · longest ${max} min · ${ratingText}${chainTag} · ${source}.${paretoTag}`;
}

// ─── Main ranking function ────────────────────────────────────────────────────
//
// Phases covered:
//   1  Real travel times (Google DM, haversine fallback)
//   4  Proper fairness metrics (max, variance, avg)
//   7  Two-stage cost optimization (cheap pre-filter → DM on top-15)
//   8  FIX 6 social score: fairness 35%, travel 20%, rating 15%, social 30%
//  13  Pareto front
//  14  Effective (route-based) midpoint
//  16  argmin max(travel_time)

export async function rankMeetingPlaces({ plan, places, filters = {}, travelMode, debug = {} }) {
  const members = plan.members.filter((m) =>
    Number.isFinite(m.location?.latitude) && Number.isFinite(m.location?.longitude)
  );

  const normalized = places
    .map(normalizePlace)
    .filter((p) => Number.isFinite(p.location.latitude) && Number.isFinite(p.location.longitude))
    .filter((p) => passesFilters(p, filters));

  if (!normalized.length || !members.length) return { recommendations: [], paretoFront: [], effectiveMidpoint: null };

  // ── Phase 7, Stage 1: Cheap pre-filter using socialScore + haversine ─────
  // Sort by social score descending so the best candidates bubble up.
  // Then take top DM_CANDIDATE_LIMIT for the expensive API call.
  const centroid = calculateCentroid(members);
  const preRanked = normalized
    .map((p) => ({
      ...p,
      _haversineAvg: centroid
        ? haversineKm(centroid, p.location)
        : 0,
    }))
    .sort((a, b) => {
      // Composite cheap score: social quality minus distance penalty
      const scoreA = (a.socialScore || 0) - a._haversineAvg * 3;
      const scoreB = (b.socialScore || 0) - b._haversineAvg * 3;
      return scoreB - scoreA;
    });

  const dmCandidates = preRanked.slice(0, DM_CANDIDATE_LIMIT);
  const dmCandidateIds = new Set(dmCandidates.map((c) => c.placeId));
  const restCandidates = preRanked.slice(DM_CANDIDATE_LIMIT);

  // ── Phase 1 & 3: Real routing via Google Distance Matrix ────────────────
  let distanceMatrix = null;
  try {
    distanceMatrix = await computeTravelMatrix({
      users: members.map((m) => ({
        userId: m.userId,
        name: m.name,
        location: {
          latitude: m.location.latitude,
          longitude: m.location.longitude,
        },
  travelMode: m.travelMode || travelMode || 'driving',
})),
      candidates: dmCandidates.map((p) => ({
        _id: p.placeId,
        location: {
          coordinates: [
            p.location.longitude,
            p.location.latitude,
          ],
        },
      })),
      mode: travelMode || 'driving',
      debug,
    });
  } catch (err) {
    debug.matrixError = err.message;
  }

  debug.usingRealRouting = debug.usedGoogleMatrix === true;

  // ── Build travel times per place (real or fallback) ──────────────────────

  function getTravelTimesForPlace(place, useMatrix) {
    return members.map((member) => {
      const mode = member.travelMode || travelMode || 'driving';

      if (useMatrix && distanceMatrix instanceof Map) {
        const placeMap = distanceMatrix.get(place.placeId);
        const dmResult = placeMap?.get(member.userId);
        if (dmResult && Number.isFinite(dmResult.durationMinutes)){
          return {
            userId: member.userId,
            name: member.name,
            mode: dmResult.mode,
            distanceKm: dmResult.distanceKm,
            durationMinutes: dmResult.durationMinutes,
            source: 'google',
          };
        }
      }

      // Fallback to haversine for this specific user/place pair
      return estimateTravelFallback(member, place.location, mode);
    });
  }

  // ── Score all candidates ──────────────────────────────────────────────────

  const allScoredIntermediate = [...dmCandidates, ...restCandidates].map((place) => {
    const useMatrix = !!distanceMatrix && dmCandidateIds.has(place.placeId);
    const travelTimes = getTravelTimesForPlace(place, useMatrix);
    const durations = travelTimes.map((t) => t.durationMinutes);
    const metrics = computeFairnessMetrics(durations);

    return { place, travelTimes, metrics, durations };
  });

  // Collect all metrics for normalization
  const allMetrics = allScoredIntermediate.map((x) => x.metrics);

  // ── Phase 12: Final score = fairness(35%) + travel(20%) + rating(15%) + social(30%) ──

  const scored = allScoredIntermediate.map(({ place, travelTimes, metrics, durations }) => {
    const fairnessScore = normalizeFairnessScore(metrics, allMetrics);

    const maxMinutes = metrics.max;
    const avgMinutes = metrics.avg;
    const minMinutes = metrics.min;
    const spread = maxMinutes - minMinutes;

    // Travel score: lower average travel = better; cap at 120 min
    const travelScore = Math.max(0, 100 - (avgMinutes / 120) * 100);

    // Rating score: 0–100 from 0–5 stars; default 62 (3.1 stars) if missing
    const ratingScore = place.rating ? (place.rating / 5) * 100 : 62;

    // Social score already computed in googlePlaces.js (0–100+)
    // Clamp to 100 for weight calculation
    const socialScore = Math.min(100, place.socialScore || 0);

    const voteCount = plan.votes?.filter((v) => v.placeId === place.placeId).length || 0;

    const baseScore = Math.round(
      (fairnessScore * 0.35) +
      (travelScore * 0.20) +
      (ratingScore * 0.15) +
      (socialScore * 0.30)
    );

    const totalScore = baseScore + (voteCount * 3);

    const isRealRouting = !!distanceMatrix && dmCandidateIds.has(place.placeId);

    return {
      ...place,
      voteCount,
      votedBy: plan.votes
        ?.filter((v) => v.placeId === place.placeId)
        .map((v) => String(v.userId)) || [],
      openNow: isOpenNow(place),
      travelTimes,
      travelStats: {
        averageMinutes: Number(avgMinutes.toFixed(1)),
        maxMinutes,
        minMinutes,
        spreadMinutes: spread,
        varianceMinutes: Number(metrics.variance.toFixed(1)),
      },
      fairnessScore,
      totalScore,
      _isRealRouting: isRealRouting,
    };
  });

  // ── Phase 13: Pareto front ────────────────────────────────────────────────
  const paretoFront = computeParetoFront(scored);
  const paretoIds = new Set(paretoFront.map((p) => p.placeId));

  // Add reason string now that we know pareto membership
  const scoredWithReason = scored.map((p) => ({
  ...p,
  isPareto: paretoIds.has(p.placeId),
  reason: buildReason({
    fairnessScore: p.fairnessScore,
    travelStats: p.travelStats,
    place: p,
    isRealRouting: p._isRealRouting,
    isPareto: paretoIds.has(p.placeId),
  }),
}));

  // ── Final sort and slice ──────────────────────────────────────────────────
  const recommendations = scoredWithReason
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, TOP_PLACE_LIMIT);

  // ── Phase 14/16: Effective midpoint (route-based) ─────────────────────────
  const effectiveMidpoint = computeEffectiveMidpoint(recommendations);

  return {
    recommendations,
    paretoFront: paretoFront.slice(0, 3),  // top-3 pareto options
    effectiveMidpoint,
    geometricCentroid: centroid,            // kept for map viz
    usingRealRouting: debug.usedGoogleMatrix === true,
  };
}

// ─── Emergency alternatives ───────────────────────────────────────────────────

export function getEmergencyAlternatives(recommendations, selectedPlaceId) {
  const anchor = recommendations.find((p) => p.placeId === selectedPlaceId) || recommendations[0];
  if (!anchor) return [];

  return recommendations
    .filter((p) => p.placeId !== anchor.placeId)
    .map((p) => ({
      ...p,
      distanceFromTopKm: Number(haversineKm(anchor.location, p.location).toFixed(2)),
    }))
    .filter((p) => p.distanceFromTopKm <= 1.5 || p.fairnessScore >= anchor.fairnessScore - 8)
    .slice(0, 3);
}

// ─── Common availability (unchanged logic, kept for compatibility) ──────────

function toMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function getCommonAvailability(members) {
  const withAvail = members.filter((m) => m.availability?.length);
  if (!withAvail.length) return [];

  const days = [...new Set(withAvail.flatMap((m) => m.availability.map((s) => s.day)))];

  return days.flatMap((day) => {
    const windows = withAvail.map((m) => m.availability.find((s) => s.day === day));
    if (windows.some((s) => !s)) return [];

    const start = Math.max(...windows.map((s) => toMinutes(s.startTime)).filter(Number.isFinite));
    const end = Math.min(...windows.map((s) => toMinutes(s.endTime)).filter(Number.isFinite));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

    return [{ day, startTime: toTime(start), endTime: toTime(end), durationMinutes: end - start }];
  });
}
