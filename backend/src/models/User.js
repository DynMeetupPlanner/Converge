import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    dateOfBirth: {
      type: Date,
      required: true,
       validate: {
        validator: function (value) {
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          return value < today;
        },
        message: "User must be present",
      },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    lastLogin: {
      type: Date,
    },

    resetPasswordOTP: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    savedPlaces: [{
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
      status: {
        type: String,
        enum: ['saved', 'visited'],
        default: 'saved',
      },
      location: {
        latitude: Number,
        longitude: Number,
      },
      links: {
        maps: String,
        zomato: String,
        swiggy: String,
      },
      savedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    preferredSpotType: {
      type: String,
      enum: ['all', 'cafe', 'restaurant', 'park', 'mall', 'bar'],
      default: 'cafe',
    },
},{
    timestamps: true
});

userSchema.methods.updateLastLogin = function () {
  return this.updateOne({ lastLogin: new Date() });
};


const User = mongoose.model("User",userSchema)

export default User;
