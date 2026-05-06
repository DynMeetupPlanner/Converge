import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  preference: String,
  travelMode: {
    type: String,
    enum: ['walking', 'driving', 'transit'],
    default: 'driving'
  },
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }]
});

const placeSnapshotSchema = new mongoose.Schema({
  placeId: String,
  name: String,
  category: String,
  rating: Number,
  ratingSource: String,
  priceLevel: String,
  vicinity: String,
  openingHours: String,
  phone: String,
  website: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  links: {
    maps: String,
    zomato: String,
    swiggy: String
  }
}, { _id: false });

const voteSchema = new mongoose.Schema({
  placeId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  place: placeSnapshotSchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const historySchema = new mongoose.Schema({
  place: placeSnapshotSchema,
  decidedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  midpoint: {
    latitude: Number,
    longitude: Number
  },
  votes: [voteSchema],
  meetingHistory: [historySchema]
}, {
  timestamps: true
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
