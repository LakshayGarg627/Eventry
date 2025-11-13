const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const {eventsSchema}=require("../schema.js");
const Event=require("../models/events.js");

const {isLoggedIn,isOwner,validateEvent}=require("../middleware.js");

router.get("/",wrapAsync(async(req,res)=>{
    const allEvents=await Event.find({});
    res.render("./eventListings/index.ejs",{allEvents})
}));

router.get("/test-flash", (req, res) => {
    req.flash("success", "This is a success message!");
    req.flash("error", "This is an error message!");
    req.flash("warning", "This is a warning message!");
    req.flash("info", "This is an info message!");
    res.redirect("/events");
});

router.get("/new",isLoggedIn,(req,res)=>{
    res.render("./eventListings/new.ejs");
});
router.post("/",isLoggedIn,validateEvent,wrapAsync(async (req,res,next)=>{
    const { title, description, image, entryFee, eventType, eventCategory, location, date } = req.body.event;
    const newEvent = new Event({
        title,
        description,
        image,
        entryFee: Number(entryFee),
        eventType,
        eventCategory,
        location,
        date: new Date(date) 
    });
    newEvent.owner=req.user._id;
    await newEvent.save();
    req.flash("success", `Event "${title}" has been created successfully!`);
    res.redirect("/events");
}));

router.get("/:id",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const event=await Event.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!event){
        req.flash("error", "Oops! The event you're looking for doesn't exist or has been removed.");
        res.redirect("/events");
    }else{
        res.render("./eventListings/show.ejs",{event});
    }

}));

router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const event= await Event.findById(id);
    if(!event){
        req.flash("error", "Sorry, we couldn't find that event. It might have been removed or the link is incorrect.");
        res.redirect("/events");
    }else{
        res.render("./eventListings/edit.ejs",{event});
    }
}));

router.put("/:id",isLoggedIn,isOwner,validateEvent,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await Event.findByIdAndUpdate(id,{...req.body.event},{new:true});
    req.flash("success", `Event details have been updated successfully!`);
    res.redirect(`/events/${id}`);
}));

router.delete("/:id",isLoggedIn,isOwner,wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deletedEvent= await Event.findByIdAndDelete(id);
    req.flash("success", `Event "${deletedEvent.title}" has been deleted successfully!`);
    res.redirect("/events");
}));

module.exports=router;