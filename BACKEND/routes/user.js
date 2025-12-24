const express=require("express");
const router=express.Router();
const User=require("../models/user");
const passport=require("passport");
const Event=require("../models/events");
const Review=require("../models/review");
const Booking=require("../models/booking");
const wrapAsync=require("../utils/wrapAsync");
const { saveRedirectUrl, isLoggedIn } = require("../middleware");

router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});
router.post("/signup",async(req,res)=>{
    try{
        let {username,email,password}=req.body;
        const newUser=new User({username,email});
        const registeredUser=await User.register(newUser,password);
        console.log(registeredUser);
        req.flash("success","Registered Successfully");
        res.redirect("/login");
    }
    catch(err){
        console.log("Username already exists");
        req.flash("error","User with the mail already exists");
        res.redirect("/signup");
    }
});
router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});
router.post("/login",
    saveRedirectUrl,
    passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),
    async(req,res)=>{
    req.flash("success","Logged in successfully");
    let redirectUrl=res.locals.redirectUrl || "/events";
    res.redirect(redirectUrl);
});

router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success","Logged out successfully");
        res.redirect("/login");
    });
});

router.get("/profile", isLoggedIn, wrapAsync(async(req,res)=>{
    const userEvents = await Event.find({ owner: req.user._id }).sort({ date: -1 });
    const userReviews = await Review.find({ author: req.user._id }).sort({ createdAt: -1 }).limit(10);
    const userBookings = await Booking.find({ user: req.user._id, status: "confirmed" })
        .populate("event")
        .sort({ bookingDate: -1 });
    
    // Get event details for reviews
    const reviewsWithEvents = await Promise.all(
        userReviews.map(async (review) => {
            const event = await Event.findOne({ reviews: review._id });
            return {
                review,
                event
            };
        })
    );
    
    res.render("users/profile.ejs", { 
        user: req.user, 
        userEvents, 
        reviewsWithEvents,
        userBookings,
        totalEvents: userEvents.length,
        totalReviews: userReviews.length,
        totalBookings: userBookings.length
    });
}));

module.exports=router;