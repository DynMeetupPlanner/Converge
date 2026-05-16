import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, sparse: true },
  source: { type: String, default: 'overpass' },
  name: { type: String, required: true },
  category: { type: String, enum: ['cafe', 'restaurant', 'park', 'mall', 'bar'], required: true },
  rating: { type: Number },
  ratingSource: { type: String },
  userRatingsTotal: { type: Number },
  googlePlaceId: { type: String },
  vicinity: { type: String },
  openingHours: { type: String },
  phone: { type: String },
  website: { type: String },
  cuisine: { type: String },
  wheelchair: { type: String },
  priceLevel: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat] — MongoDB order
  },
  cachedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
});

placeSchema.index({ location: '2dsphere' });
placeSchema.index({ externalId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Place', placeSchema);
