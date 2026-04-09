const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapToken });
const { cloudinary } = require("../cloudConfig.js");
const Review = require("../models/review.js");


// Add this tiny helper function at the top of your file
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports.searchListings = async (req, res) => {
    let { q } = req.query;
    if (!q || q.trim() === "") return res.redirect("/listings");
    
    // SANITIZE THE INPUT FIRST
    const safeQuery = escapeRegex(q);

    const allListings = await Listing.find({
        $or: [
            { location: { $regex: safeQuery, $options: "i" } },
            { country: { $regex: safeQuery, $options: "i" } },
            { title: { $regex: safeQuery, $options: "i" } }
        ]
    }).populate('reviews');
    
    res.render("listings/index.ejs", { allListings, currentCategory: null });
};

module.exports.index = async (req, res) => {
    const { category, page = 1 } = req.query; 
    const limit = 20; 
    
    let filter = category ? { category } : {};
    
    const allListings = await Listing.find(filter)
        .populate("reviews") // 🚨 ADD THIS LINE to load the rating data
        .skip((page - 1) * limit)
        .limit(limit);

    res.render('listings/index.ejs', { allListings, currentCategory: category, currentPage: page });
};

module.exports.exploreListings = async (req, res) => {
    const { category } = req.query;
    let filter = category ? { category } : {};
    const allListings = await Listing.find(filter).populate('reviews');
    res.render('listings/explore.ejs', { allListings, currentCategory: category });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
    // 1. Image Check
    if (!req.files || req.files.length === 0) {
        req.flash("error", "You must upload at least one image.");
        return res.redirect("/listings/new");
    }

    // 2. Mapbox Geocoding
    let geoResponse = await geocoder.forwardGeocode({
        query: `${req.body.listing.location}, ${req.body.listing.country}`,
        limit: 1
    }).send();

    if (!geoResponse.body.features.length) {
        req.flash("error", "Location not found on map. Please enter a valid city.");
        return res.redirect("/listings/new");
    }

    // 3. Assemble and Save
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.geometry = geoResponse.body.features[0].geometry; 
    newListing.images = req.files.map(f => ({ url: f.path, filename: f.filename }));

    await newListing.save();
    
    req.flash("success", "Listing published successfully");
    // ✅ FIX: Redirect directly to their new sanctuary so they know it worked!
    res.redirect(`/listings/${newListing._id}`); 
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    
    if (!listing) {
        req.flash("error","Sorry, this listing couldn’t be found");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Sorry, this listing couldn’t be found");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    // 1. Find the listing to update
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "The Lisitngs you are trying to update does not exist.");
        return res.redirect("/listings");
    }

    // 2. ✅ FIX: Safely update text fields directly on the document (Prevents data revert)
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;
    listing.category = req.body.listing.category;
    listing.upiId = req.body.listing.upiId;

    // 3. ✅ FIX: Update Mapbox Location if they changed the city!
    let geoResponse = await geocoder.forwardGeocode({
        query: `${req.body.listing.location}, ${req.body.listing.country}`,
        limit: 1
    }).send();

    if (geoResponse.body.features.length) {
        listing.geometry = geoResponse.body.features[0].geometry;
    }

    // 4. Add new images safely
    if (req.files && req.files.length > 0) {
        let newImages = req.files.map(file => ({ url: file.path, filename: file.filename }));
        listing.images.push(...newImages);
    }

    // 5. Save everything to the database AT ONCE
    await listing.save();

    req.flash("success", "Listings Details Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    
    // 1. Find the listing FIRST so we know what images to delete
    const listing = await Listing.findById(id);
    
    // 2. Loop through the images and destroy them on Cloudinary
    if (listing.images && listing.images.length > 0) {
        for (let img of listing.images) {
            await cloudinary.uploader.destroy(img.filename);
        }
    }
    
    // 3. Now delete the listing from MongoDB
    await Listing.findByIdAndDelete(id);
    
    req.flash("success","Listing deleted successfully");
    res.redirect("/listings");
};

module.exports.showImages = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("Booking/images.ejs", { listing }); 
};