const EARTH_RADIUS_KM = 6371;
const SPEED_KMPH = {
  walking: 4.5,
  driving: 28,
  transit: 18,
};

const ROAD_FACTOR = {
  walking: 1.15,
  driving: 1.35,
  transit: 1.45,
};

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

export function calculateCentroid(members) {
  const located = members.filter((member) => Number.isFinite(member.location?.latitude)
    && Number.isFinite(member.location?.longitude));

  if (!located.length) return null;

  return {
    latitude: located.reduce((sum, member) => sum + member.location.latitude, 0) / located.length,
    longitude: located.reduce((sum, member) => sum + member.location.longitude, 0) / located.length,
  };
}

function estimateTravel(member, placeCoords, requestedMode) {
  const mode = requestedMode || member.travelMode || 'driving';
  const speed = SPEED_KMPH[mode] || SPEED_KMPH.driving;
  const factor = ROAD_FACTOR[mode] || ROAD_FACTOR.driving;
  const straightDistanceKm = haversineKm(member.location, placeCoords);
  const distanceKm = straightDistanceKm * factor;

  return {
    userId: member.userId,
    name: member.name,
    mode,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.max(1, Math.round((distanceKm / speed) * 60)),
  };
}

function getFairnessScore(travelTimes) {
  if (!travelTimes.length) return 0;
  const durations = travelTimes.map((item) => item.durationMinutes);
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const spread = max - min;
  const balancePenalty = avg > 0 ? (spread / avg) * 42 : 0;
  const burdenPenalty = Math.max(0, max - 45) * 0.6;
  return Math.max(0, Math.min(100, Math.round(100 - balancePenalty - burdenPenalty)));
}

function normalizePlace(place) {
  const [longitude, latitude] = place.location?.coordinates || [];
  return {
    placeId: place._id,
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    category: place.category,
    rating: place.rating ?? null,
    ratingSource: place.ratingSource || (place.rating ? 'google' : null),
    userRatingsTotal: place.userRatingsTotal ?? null,
    priceLevel: place.priceLevel || 'unknown',
    vicinity: place.vicinity,
    openingHours: place.openingHours,
    phone: place.phone,
    website: place.website,
    cuisine: place.cuisine,
    wheelchair: place.wheelchair,
    openNow: typeof place.openNow === 'boolean' ? place.openNow : null,
    businessStatus: place.businessStatus,
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
  if (!place.openingHours) return null;
  return place.openingHours === '24/7';
}

function passesFilters(place, filters) {
  if (filters.minRating && place.rating && place.rating < filters.minRating) return false;
  if (filters.priceLevel && filters.priceLevel !== 'any' && place.priceLevel !== filters.priceLevel) return false;
  if (filters.openNow) {
    const open = isOpenNow(place);
    if (open === false) return false;
  }
  return true;
}

function buildReason({ fairnessScore, travelStats, place }) {
  const avg = Math.round(travelStats.averageMinutes);
  const max = travelStats.maxMinutes;
  const ratingText = place.rating
    ? `rated ${place.rating.toFixed(1)} on Google`
    : 'Google rating unavailable for this spot';
  return `Fairness ${fairnessScore}/100, average travel ${avg} min, longest travel ${max} min, ${ratingText}.`;
}

export function rankMeetingPlaces({ plan, places, filters = {}, travelMode }) {
  const members = plan.members.filter((member) => Number.isFinite(member.location?.latitude)
    && Number.isFinite(member.location?.longitude));

  return places
    .map(normalizePlace)
    .filter((place) => Number.isFinite(place.location.latitude) && Number.isFinite(place.location.longitude))
    .filter((place) => passesFilters(place, filters))
    .map((place) => {
      const travelTimes = members.map((member) => estimateTravel(member, place.location, travelMode));
      const durations = travelTimes.map((item) => item.durationMinutes);
      const averageMinutes = durations.reduce((sum, value) => sum + value, 0) / Math.max(1, durations.length);
      const maxMinutes = Math.max(...durations);
      const minMinutes = Math.min(...durations);
      const fairnessScore = getFairnessScore(travelTimes);
      const travelScore = Math.max(0, 100 - averageMinutes);
      const ratingScore = place.rating ? place.rating * 20 : 62;
      const totalScore = Math.round((fairnessScore * 0.5) + (travelScore * 0.35) + (ratingScore * 0.15));

      const voteCount = plan.votes?.filter((vote) => vote.placeId === place.placeId).length || 0;

      return {
        ...place,
        voteCount,
        votedBy: plan.votes
          ?.filter((vote) => vote.placeId === place.placeId)
          .map((vote) => String(vote.userId)) || [],
        openNow: isOpenNow(place),
        travelTimes,
        travelStats: {
          averageMinutes: Number(averageMinutes.toFixed(1)),
          maxMinutes,
          minMinutes,
          spreadMinutes: maxMinutes - minMinutes,
        },
        fairnessScore,
        totalScore: totalScore + (voteCount * 3),
        reason: buildReason({
          fairnessScore,
          travelStats: { averageMinutes, maxMinutes },
          place,
        }),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function getEmergencyAlternatives(recommendations, selectedPlaceId) {
  const anchor = recommendations.find((place) => place.placeId === selectedPlaceId) || recommendations[0];
  if (!anchor) return [];

  return recommendations
    .filter((place) => place.placeId !== anchor.placeId)
    .map((place) => ({
      ...place,
      distanceFromTopKm: Number(haversineKm(anchor.location, place.location).toFixed(2)),
    }))
    .filter((place) => place.distanceFromTopKm <= 1.5 || place.fairnessScore >= anchor.fairnessScore - 8)
    .slice(0, 3);
}

function toMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

export function getCommonAvailability(members) {
  const located = members.filter((member) => member.availability?.length);
  if (!located.length) return [];

  const days = [...new Set(located.flatMap((member) => member.availability.map((slot) => slot.day)))];

  return days.flatMap((day) => {
    const windows = located.map((member) => member.availability.find((slot) => slot.day === day));
    if (windows.some((slot) => !slot)) return [];

    const start = Math.max(...windows.map((slot) => toMinutes(slot.startTime)).filter(Number.isFinite));
    const end = Math.min(...windows.map((slot) => toMinutes(slot.endTime)).filter(Number.isFinite));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

    return [{
      day,
      startTime: toTime(start),
      endTime: toTime(end),
      durationMinutes: end - start,
    }];
  });
}
