const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn, wrapAsync } = require("../middleware.js");

router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.renderUserBookings));
router.delete("/bookings/:id", isLoggedIn, wrapAsync(bookingController.cancelBooking));

router.get("/mylistings", isLoggedIn, wrapAsync(bookingController.renderMyListings));
router.get("/reservations", isLoggedIn, wrapAsync(bookingController.renderHostReservations));
router.delete("/reservations/:id", isLoggedIn, wrapAsync(bookingController.cancelHostReservation));

module.exports = router;