const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut } = req.body;
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    // 1. Protect against past bookings
    if (startDate < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // 2. Protect against negative time travel (Check-out before Check-in)
    if (nights <= 0) {
        req.flash("error", "Check-out must be at least 1 day after Check-in.");
        return res.redirect(`/listings/${listing._id}`);
    }

    // 3. THE FIX: Protect against Double Bookings! (Overlapping dates)
    const existingBookings = await Booking.find({
        listing: listing._id, 
        $or: [
            // Standard hotel logic: If dates overlap, block it. 
            // (Using strict < and > allows someone to check-out on the same day someone else checks-in)
            { checkIn: { $lt: endDate }, checkOut: { $gt: startDate } } 
        ]
    });

    if (existingBookings.length > 0) {
        req.flash("error", "This property is already booked for your selected dates");
        return res.redirect(`/listings/${listing._id}`);
    }

    // 4. If all security checks pass, calculate price and save!
    const totalPrice = nights * listing.price;
    const booking = new Booking({
        listing: listing._id, 
        user: req.user._id,
        checkIn: startDate, 
        checkOut: endDate, 
        totalPrice: totalPrice
    });

    await booking.save();
    req.flash("success", `Your booking is confirmed • Total: ₹${totalPrice.toLocaleString("en-IN")}`);
    res.redirect(`/listings/${listing._id}`);
};

module.exports.renderUserBookings = async (req, res) => {
    let userBookings = await Booking.find({ user: req.user._id }).populate("listing");
    
    // It removes any bookings where the listing was deleted
    userBookings = userBookings.filter(booking => booking.listing !== null);
    
    res.render("Booking/bookings.ejs", { userBookings });
};

module.exports.cancelBooking = async (req, res) => {
    let { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/bookings");
    }
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "Unauthorized: You cannot cancel this booking.");
        return res.redirect("/bookings");
    }
    await Booking.findByIdAndDelete(id);
    req.flash("success", "Your booking has been cancelled");
    res.redirect("/bookings");
};

module.exports.renderMyListings = async (req, res) => {
    const myListings = await Listing.find({ owner: req.user._id });
    res.render("Booking/mylistings.ejs", { myListings });
};

module.exports.renderHostReservations = async (req, res) => {
    const myListings = await Listing.find({ owner: req.user._id });
    const myListingIds = myListings.map(listing => listing._id);
    const reservations = await Booking.find({ listing: { $in: myListingIds } })
        .populate("user").populate("listing").sort({ checkIn: 1 }); 
    res.render("Booking/reservations.ejs", { reservations });
};

module.exports.cancelHostReservation = async (req, res) => {
    let { id } = req.params;
    const booking = await Booking.findById(id).populate("listing");
    
    if (!booking) {
        req.flash("error", "Reservation not found.");
        return res.redirect("/reservations");
    }
    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "Unauthorized: You can only cancel reservations for your own properties.");
        return res.redirect("/reservations");
    }
    await Booking.findByIdAndDelete(id);
    req.flash("success", "Reservation cancelled. The guest has been notified.");
    res.redirect("/reservations");
};