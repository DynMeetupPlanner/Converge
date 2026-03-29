import express from 'express';
import Place from '../models/Place.js';

const router = express.Router();

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseFloat(radius) * 1000;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ msg: 'Valid lat and lng are required' });
    }

    if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({ msg: 'Radius must be a positive number' });
    }

    const query = {
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const places = await Place.find(query).limit(50);
    return res.json({ places });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
