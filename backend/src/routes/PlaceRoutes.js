import express from 'express';
import Place from '../models/Place.js';
import User from '../models/User.js';
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

router.get('/saved', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ msg: 'userId required' });

    const user = await User.findById(userId).select('savedPlaces');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({ places: user.savedPlaces || [] });
  } catch (err) {
    console.error('Saved places error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/saved', async (req, res) => {
  try {
    const { userId, place, status = 'saved' } = req.body;
    if (!userId || !place?.placeId) {
      return res.status(400).json({ msg: 'userId and place are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.savedPlaces = user.savedPlaces.filter((item) => item.placeId !== place.placeId);
    user.savedPlaces.unshift({
      ...place,
      status,
      savedAt: new Date(),
    });

    await user.save();
    res.json({ msg: 'Place saved', places: user.savedPlaces });
  } catch (err) {
    console.error('Save place error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.patch('/saved/:placeId', async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) return res.status(400).json({ msg: 'userId and status required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const place = user.savedPlaces.find((item) => item.placeId === req.params.placeId);
    if (!place) return res.status(404).json({ msg: 'Saved place not found' });

    place.status = status;
    await user.save();

    res.json({ msg: 'Saved place updated', places: user.savedPlaces });
  } catch (err) {
    console.error('Update saved place error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
