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
  preference: String
});

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
  }
}, {
  timestamps: true
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
