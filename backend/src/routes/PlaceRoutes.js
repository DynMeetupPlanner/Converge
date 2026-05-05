import express from 'express';

const router = express.Router();
const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const USER_AGENT = process.env.OSM_USER_AGENT || 'ConvergeApp/1.0';

const CATEGORY_FILTERS = {
  cafe: ['node["amenity"="cafe"]'],
  restaurant: ['node["amenity"="restaurant"]'],
  park: ['node["leisure"="park"]'],
};

function buildOverpassQuery(latitude, longitude, radius, category) {
  const categories =
    category && category !== "all"
      ? [category]
      : Object.keys(CATEGORY_FILTERS);

  const filters = categories.flatMap(
    (item) => CATEGORY_FILTERS[item] || []
  );

  if (!filters.length) {
    throw new Error("No filters generated");
  }

  const nearbyFilters = filters
    .map(
      (f) => `${f}(around:${radius},${latitude},${longitude});`
    )
    .join("\n");

  return `[out:json][timeout:10];
(
${nearbyFilters}
);
out center 50;`;
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
    // 1. Safer defaults
    const { lat, lng, radius = 0.3, category = "all" } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const maxDistance = Math.round(radiusKm * 1000); // meters

    // 2. Validation
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ msg: 'Valid lat and lng are required' });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({ msg: 'Radius must be a positive number' });
    }

    if (category !== 'all' && !CATEGORY_FILTERS[category]) {
      return res.status(400).json({ msg: 'Unsupported category' });
    }

    // 3. Build query
    const overpassQuery = buildOverpassQuery(
      latitude,
      longitude,
      maxDistance,
      category
    );

    if (!overpassQuery || !overpassQuery.trim()) {
      throw new Error("Generated Overpass query is empty");
    }

    console.log("QUERY:\n", overpassQuery);

    // 4. Use GET (same as your working browser test)
    const encodedQuery = encodeURIComponent(overpassQuery);
    const url = `${OVERPASS_URL}?data=${encodedQuery}`;

    console.log("REQUEST URL:", url);

    // 5. Add timeout (prevents hanging)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }


    // 6. Read safely (DO NOT use response.json directly)
    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Invalid Overpass response:", raw.slice(0, 300));
      throw new Error("Overpass returned non-JSON");
    }

    if (!response.ok) {
      throw new Error(`Overpass error: ${response.status}`);
    }

    // 7. Process results
    const seen = new Set();

    const places = (data.elements || [])
      .map(formatPlace)
      .filter(Boolean)
      .filter((place) => {
        if (seen.has(place._id)) return false;
        seen.add(place._id);
        return true;
      })
      .slice(0, 50);

    console.log("Results count:", places.length);

    return res.json({
      places,
      count: places.length,
      source: "openstreetmap",
    });

  } catch (err) {
      console.error("Nearby places failed:", err);

      if (err.name === "AbortError") {
        return res.status(504).json({
          msg: "Request timeout",
        });
      }

      return res.status(500).json({
        msg: "Server error",
        error: err.message,
      });
    }
});


export default router;
