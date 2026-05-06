const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const USER_AGENT = process.env.OSM_USER_AGENT || 'ConvergeApp/1.0';
const CONTACT_EMAIL = process.env.OSM_CONTACT_EMAIL;

const CATEGORY_QUERIES = {
  cafe: [
    'node["amenity"="cafe"]',
    'node["amenity"="coffee_shop"]',
  ],
  restaurant: [
    'node["amenity"="restaurant"]',
    'node["amenity"="fast_food"]',
  ],
  park: [
    'node["leisure"="park"]',
    'way["leisure"="park"]',
    'relation["leisure"="park"]',
  ],
};

function clampRadiusMeters(radiusKm) {
  const meters = Number(radiusKm) * 1000;
  if (!Number.isFinite(meters)) return 5000;
  return Math.max(100, Math.min(50000, meters));
}

function toPlace(elements, category) {
  return elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const name = el.tags?.name;
      if (!name) return null;

      const vicinityParts = [
        el.tags?.['addr:housenumber'],
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ].filter(Boolean);

      return {
        _id: `osm-${el.type}-${el.id}`,
        name,
        rating: null,
        category,
        vicinity: vicinityParts.join(' ') || undefined,
        location: { coordinates: [lon, lat] },
      };
    })
    .filter(Boolean);
}

function detectCategory(tags) {
  const amenity = tags?.amenity;
  const leisure = tags?.leisure;

  if (leisure === 'park') return 'park';
  if (amenity === 'cafe' || amenity === 'coffee_shop') return 'cafe';
  if (amenity === 'restaurant' || amenity === 'fast_food') return 'restaurant';

  return null;
}

function buildOverpassQuery({ lat, lng, radiusMeters, category }) {
  const cats = category === 'all'
    ? /** @type {const} */ (['cafe', 'restaurant', 'park'])
    : [category];

  const blocks = cats.flatMap((cat) => {
    const selectors = CATEGORY_QUERIES[cat] || [];
    return selectors.map((selector) => `${selector}(around:${radiusMeters},${lat},${lng});`);
  });

  return `
    [out:json][timeout:20];
    (
      ${blocks.join('\n      ')}
    );
    out center 50;
  `;
}

export async function fetchNearbyPlacesOverpass({ lat, lng, radiusKm, category = 'all' }) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const radiusMeters = clampRadiusMeters(radiusKm);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('lat and lng are required numeric values');
  }

  const normalizedCategory = category && category !== 'all' ? String(category) : 'all';

  const query = buildOverpassQuery({
    lat: latitude,
    lng: longitude,
    radiusMeters,
    category: normalizedCategory,
  });

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      'User-Agent': USER_AGENT,
      ...(CONTACT_EMAIL ? { 'From': CONTACT_EMAIL } : {}),
      Accept: 'application/json',
    },
    body: query,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Overpass error ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const elements = Array.isArray(data.elements) ? data.elements : [];

  const seen = new Set();
  const places = [];

  for (const el of elements) {
    const detected = detectCategory(el.tags);
    if (!detected) continue;
    if (normalizedCategory !== 'all' && detected !== normalizedCategory) continue;

    const [place] = toPlace([el], detected);
    if (!place) continue;
    if (seen.has(place._id)) continue;
    seen.add(place._id);
    places.push(place);
  }

  return places;
}
