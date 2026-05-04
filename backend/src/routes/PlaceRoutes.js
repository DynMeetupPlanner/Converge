import express from 'express';

const router = express.Router();
const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const USER_AGENT = process.env.OSM_USER_AGENT || 'ConvergeApp/1.0';

const CATEGORY_FILTERS = {
  cafe: ['node["amenity"="cafe"]', 'way["amenity"="cafe"]', 'relation["amenity"="cafe"]'],
  restaurant: [
    'node["amenity"="restaurant"]',
    'way["amenity"="restaurant"]',
    'relation["amenity"="restaurant"]',
  ],
  park: ['node["leisure"="park"]', 'way["leisure"="park"]', 'relation["leisure"="park"]'],
};

function buildOverpassQuery(latitude, longitude, radius, category) {
  const categories = category && category !== 'all' ? [category] : Object.keys(CATEGORY_FILTERS);
  const filters = categories.flatMap((item) => CATEGORY_FILTERS[item] || []);
  const nearbyFilters = filters
    .map((filter) => `${filter}(around:${radius},${latitude},${longitude});`)
    .join('\n');

  return `
    [out:json][timeout:25];
    (
      ${nearbyFilters}
    );
    out center 60;
  `;
}

function getCategory(tags = {}) {
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.leisure === 'park') return 'park';
  return 'place';
}

function getElementCoords(element) {
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

function formatPlace(element) {
  const coords = getElementCoords(element);

  if (!coords) {
    return null;
  }

  const category = getCategory(element.tags);
  const name = element.tags?.name || `${category[0].toUpperCase()}${category.slice(1)}`;

  return {
    _id: `${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name,
    category,
    location: {
      type: 'Point',
      coordinates: [coords.longitude, coords.latitude],
    },
    address: element.tags?.['addr:full'] || element.tags?.['addr:street'],
  };
}

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const maxDistance = radiusKm * 1000;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ msg: 'Valid lat and lng are required' });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({ msg: 'Radius must be a positive number' });
    }

    if (category && category !== 'all' && !CATEGORY_FILTERS[category]) {
      return res.status(400).json({ msg: 'Unsupported category' });
    }

    const overpassQuery = buildOverpassQuery(latitude, longitude, Math.round(maxDistance), category);
    console.log("Query:", overpassQuery);
    console.log("URL:", OVERPASS_URL);
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      body: new URLSearchParams({ data: overpassQuery }).toString(),
    });

    if (!response.ok) {
      return res.status(response.status).json({ msg: 'Places service failed' });
    }

    const data = await response.json();
    const seen = new Set();
    const places = (data.elements || [])
      .map(formatPlace)
      .filter(Boolean)
      .filter((place) => {
        if (seen.has(place._id)) {
          return false;
        }

        seen.add(place._id);
        return true;
      })
      .slice(0, 50);

    return res.json({ places, source: 'openstreetmap' });
  } catch (err) {
      console.error("Nearby places failed:", err); // already there
      return res.status(500).json({ 
        msg: "Server error",
        error: err.message
      });
    }
});

export default router;
