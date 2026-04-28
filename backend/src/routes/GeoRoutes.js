import express from 'express';

const router = express.Router();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = process.env.OSM_USER_AGENT || 'ConvergeApp/1.0';
const geocodeCache = new Map();

router.get('/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    const cacheKey = query.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return res.json(geocodeCache.get(cacheKey));
    }

    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '5',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ msg: 'Geocoding service failed' });
    }

    const results = await response.json();
    const locations = results.map((item) => ({
      id: `${item.osm_type}-${item.osm_id}`,
      name: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      osmType: item.osm_type,
      osmId: item.osm_id,
    }));

    const payload = { locations, location: locations[0] || null };
    geocodeCache.set(cacheKey, payload);

    return res.json(payload);
  } catch (err) {
    console.error('Geocoding failed:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
