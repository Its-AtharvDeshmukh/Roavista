const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listings.js");


const { isLoggedIn, isOwnerOrAdmin, wrapAsync, validateListing } = require("../middleware.js");

const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ 
    storage,
    limits: { fileSize: 1024 * 1024 * 50 } 
});

router.get("/search", wrapAsync(listingController.searchListings));
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn, 
        upload.array('listing[images]', 5), 
        validateListing, 
        wrapAsync(listingController.createListing)
    );

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn, 
        isOwnerOrAdmin, 
        upload.array('listing[images]', 5), 
        validateListing, 
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwnerOrAdmin, wrapAsync(listingController.deleteListing));

router.get("/:id/edit", isLoggedIn, isOwnerOrAdmin, wrapAsync(listingController.renderEditForm));
router.get("/:id/images", wrapAsync(listingController.showImages));

module.exports = router;