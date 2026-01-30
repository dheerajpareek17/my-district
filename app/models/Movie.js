
import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema({
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

  // Movie specific fields
  genre: [{
    type: String,
    enum: [
      "Action",
      "Adventure",
      "Animation",
      "Comedy",
      "Crime",
      "Drama",
      "Family",
      "Fantasy",
      "Historical",
      "Horror",
      "Mystery",
      "Psychological Thriller",
      "Romance",
      "Sci-Fi",
      "Sport",
      "Thriller",
      "War"
    ]
  }],
  language: [{
    type: String,
    enum: ["Hindi", "English", "Malayalam", "Bengali"]
  }],
  format: [{
    type: String,
    enum: ["2D", "3D", "4DX-3D", "IMAX 2D", "4DX-2D", "ICE 2D"]
  }],

  tags: [String],
  cast: [String],
  parking: Boolean,
  rating: Number
}, {
  timestamps: true
});

export default mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);
