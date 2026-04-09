require('dotenv').config({ path: '../.env' }); // Adjust path if needed
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/roavista";

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => console.log("Connected to DB for Reset"))
    .catch(err => console.log(err));

const initDB = async () => {
    // 1. Delete absolutely everything
    await Listing.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    
    console.log("💥 Database completely wiped clean!");

    // (Optional) You can add code here to automatically create an Admin user 
    // or insert 5 perfect listings so your home page isn't empty!

    mongoose.connection.close();
};

initDB();