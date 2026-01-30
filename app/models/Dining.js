
import mongoose from "mongoose";

const DiningSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  pricePerPerson: Number,
  duration: Number,
  
  // Availability fields
  minPeople: Number,
  maxPeople: Number,
  availableTimeStart: Number,
  availableTimeEnd: Number,

  // Venue amenities
  address: String,
  district_url: String,
  wifi: Boolean,
  washroom: Boolean,
  banner_url: String,
  wheelchair: Boolean,

  // Dining specific fields
  type: [{
    type: String,
    enum: ["veg", "non-veg"]
  }],
  cuisines: [String],
  alcohol: Boolean,

  tags: [String],
  parking: Boolean,
  rating: Number
}, {
  timestamps: true
});

export default mongoose.models.Dining ||
  mongoose.model("Dining", DiningSchema);
