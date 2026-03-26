import express from 'express';
import Place from '../models/Place.js';

const router = express.Router();

// GET /places/nearby?lat=17.38&lng=78.48&radius=5&category=cafe
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;

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
    res.json({ places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;