const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ 
    url: { type: String, required: true }, 
    filename: String 
  }],
  price: { type: Number, required: true, min: [0, "Price cannot be negative!"] },
  location: { type: String, required: true },
  country: { type: String, required: true },

  upiId: { type: String, required: true }, 
  
  category: {
    type: String,
    enum: ['Trending', 'Rooms', 'Iconic Cities', 'Mountains', 'Castles', 'Amazing Pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats'],
    default: 'Trending'
  },
  geometry: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: Schema.Types.ObjectId, ref: "User" }
});


listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});


module.exports = mongoose.model("Listing", listingSchema);