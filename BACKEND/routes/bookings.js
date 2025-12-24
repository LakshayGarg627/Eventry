const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Event = require("../models/events");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");

// Book an event
router.post("/events/:id/book", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
        req.flash("error", "Event not found");
        return res.redirect("/events");
    }

    // Check if already booked (confirmed booking)
    const existingBooking = await Booking.findOne({ 
        event: id, 
        user: req.user._id,
        status: "confirmed"
    });

    if (existingBooking) {
        req.flash("error", "You have already booked this event");
        return res.redirect(`/events/${id}`);
    }

    // Check for cancelled booking and delete it to allow re-booking
    const cancelledBooking = await Booking.findOne({ 
        event: id, 
        user: req.user._id,
        status: "cancelled"
    });

    if (cancelledBooking) {
        await Booking.findByIdAndDelete(cancelledBooking._id);
    }

    try {
        const booking = new Booking({
            event: id,
            user: req.user._id,
            numberOfTickets: req.body.tickets || 1
        });

        await booking.save();
        req.flash("success", "Event booked successfully!");
        res.redirect(`/events/${id}`);
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            req.flash("error", "You have already booked this event");
        } else {
            req.flash("error", "An error occurred while booking the event");
        }
        res.redirect(`/events/${id}`);
    }
}));

// Cancel booking
router.delete("/bookings/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/profile");
    }

    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You don't have permission to cancel this booking");
        return res.redirect("/profile");
    }

    booking.status = "cancelled";
    await booking.save();
    
    req.flash("success", "Booking cancelled successfully");
    res.redirect("/profile");
}));

module.exports = router;
