const express = require("express");
const router = express.Router({ mergeParams: true }); // Crucial for getting the :id
const reviewController = require("../controllers/reviews.js");
const { isLoggedIn, isReviewAuthor, wrapAsync } = require("../middleware.js");

// Post Review
router.post("/", isLoggedIn, wrapAsync(reviewController.createReview));

// Delete Review
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;