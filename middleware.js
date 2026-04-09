const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const ADMIN_USERS = process.env.ADMIN_LIST ? process.env.ADMIN_LIST.split(',') : [];
module.exports.wrapAsync = (fn) => { 
    return (req, res, next) => fn(req, res, next).catch(next); 
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // SAVE the requested URL before redirecting to login
        req.session.redirectUrl = req.originalUrl; 
        req.flash("error", "Please login first!");
        return res.redirect("/login");
    }
    next();
};


module.exports.isOwnerOrAdmin = module.exports.wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listings not found!");
        return res.redirect("/listings");
    }

    const isListingOwner = listing.owner && listing.owner.equals(req.user._id);
    const isUserAdmin = ADMIN_USERS.includes(req.user.username);

    if (!isListingOwner && !isUserAdmin) {
        req.flash("error", "Security Alert: You do not have permission to edit or delete this Listings.");
        return res.redirect(`/listings/${id}`);
    }
    next();
});

module.exports.isReviewAuthor = module.exports.wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    
    if (!review) {
         req.flash("error", "Review not found!");
         return res.redirect(`/listings/${id}`);
    }

    if (!review.author.equals(req.user._id) && !ADMIN_USERS.includes(req.user.username)) {
        req.flash("error", "You don't have permission to delete this review.");
        return res.redirect(`/listings/${id}`);
    }
    next();
});


module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};


const Joi = require('joi');
const ExpressError = require('./utils/ExpressError');

module.exports.validateListing = (req, res, next) => {
    // 1. Define the strict rules
    const listingSchema = Joi.object({
    listing: Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            location: Joi.string().required(),
            country: Joi.string().required(),
            price: Joi.number().required().min(0),
            category: Joi.string().required(),
            upiId: Joi.string().required(),
            images: Joi.any() // Allow images handled by Multer
        }).required()
    });
    // 2. Test the incoming data against the rules
     let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


module.exports.isAdmin = (req, res, next) => {
    // 1. Check if user is logged in
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to access the admin panel.");
        return res.redirect("/login");
    }
    
    // 2. Check if user is an admin
    if (!ADMIN_USERS.includes(req.user.username)) {
        req.flash("error", "Permission Denied: Only developers can access this dashboard.");
        return res.redirect("/listings");
    }
    
    next();
};
