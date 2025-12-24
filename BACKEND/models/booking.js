const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed"
    },
    numberOfTickets: {
        type: Number,
        default: 1,
        min: 1
    }
});

// Index to prevent duplicate bookings
bookingSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);
