import express from 'express';
import Place from '../models/Place.js';
import { fetchNearbyPlacesOverpass } from '../services/places/overpass.js';

const router = express.Router();

// GET /places/nearby?lat=17.38&lng=78.48&radius=5&category=cafe
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;

    const provider = String(process.env.PLACES_PROVIDER || 'overpass').toLowerCase();
    if (provider === 'overpass') {
      try {
        const places = await fetchNearbyPlacesOverpass({
          lat,
          lng,
          radiusKm: radius,
          category: category || 'all',
        });
        return res.json({ places, source: 'overpass' });
      } catch (err) {
        console.error('Overpass nearby search failed, falling back to Mongo:', err);
      }
    }

    const query = {
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const places = await Place.find(query).limit(50);
    return res.json({ places, source: 'mongo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
