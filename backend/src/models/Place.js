import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['cafe', 'restaurant', 'park'], required: true },
  rating: { type: Number },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat] — MongoDB order
  },
});

placeSchema.index({ location: '2dsphere' });

export default mongoose.model('Place', placeSchema);