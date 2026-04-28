import express from 'express';

const router = express.Router();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const USER_AGENT = process.env.OSM_USER_AGENT || 'ConvergeApp/1.0';
const CONTACT_EMAIL = process.env.OSM_CONTACT_EMAIL;
const geocodeCache = new Map();

function formatNominatimResult(item) {
  return {
    id: `${item.osm_type}-${item.osm_id}`,
    name: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    osmType: item.osm_type,
    osmId: item.osm_id,
  };
}

function formatPhotonResult(item) {
  const [longitude, latitude] = item.geometry?.coordinates || [];
  const properties = item.properties || {};
  const nameParts = [
    properties.name,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean);

  return {
    id: `photon-${properties.osm_type || 'place'}-${properties.osm_id || properties.extent?.join('-') || nameParts.join('-')}`,
    name: nameParts.join(', ') || properties.name || 'Unnamed place',
    latitude,
    longitude,
    osmType: properties.osm_type,
    osmId: properties.osm_id,
  };
}

async function searchNominatim(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
  });

  if (CONTACT_EMAIL) {
    params.set('email', CONTACT_EMAIL);
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Nominatim failed:', response.status, body.slice(0, 300));
    return { ok: false, status: response.status };
  }

  const results = await response.json();
  return {
    ok: true,
    locations: results.map(formatNominatimResult),
  };
}

async function searchPhoton(query) {
  const params = new URLSearchParams({
    q: query,
    limit: '5',
  });

  const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Photon failed:', response.status, body.slice(0, 300));
    return { ok: false, status: response.status };
  }

  const data = await response.json();
  const locations = (data.features || [])
    .map(formatPhotonResult)
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));

  return { ok: true, locations };
}

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

    const nominatimResult = await searchNominatim(query);
    const fallbackResult = nominatimResult.ok && nominatimResult.locations.length
      ? null
      : await searchPhoton(query);
    const locations = nominatimResult.ok && nominatimResult.locations.length
      ? nominatimResult.locations
      : fallbackResult?.locations || [];

    if (!nominatimResult.ok && (!fallbackResult || !fallbackResult.ok)) {
      return res.status(502).json({
        msg: `Geocoding service failed. Nominatim status: ${nominatimResult.status}; Photon status: ${fallbackResult?.status || 'not called'}.`,
      });
    }

    const payload = { locations, location: locations[0] || null };
    geocodeCache.set(cacheKey, payload);

    return res.json(payload);
  } catch (err) {
    console.error('Geocoding failed:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
