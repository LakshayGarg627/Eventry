const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Event=require("./models/events.js");
const path=require("path");
const methodOverride=require("method-override");    
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");


const eventRouter=require("./routes/events.js");
const reviewRouter=require("./routes/reviews.js");
const userRouter=require("./routes/user.js");
const bookingRouter=require("./routes/bookings.js");

app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.set("views",path.join(__dirname,"views"));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


let mongourl="mongodb://127.0.0.1:27017/EventFlow"
main().then((req,res)=>{
    console.log("Connected to database successfully");
}).catch((err)=>{
    console.log("Error in connecting to database");
})
async function main(){
    await mongoose.connect(mongourl);
}

let port=5000;
const sessionOptions={
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7,
        httpOnly:true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.warning=req.flash("warning");
    res.locals.info=req.flash("info");
    res.locals.currUser=req.user;
    next();
});

app.get("/",async (req,res)=>{
    const allEvents=await Event.find({});
    res.render("home.ejs",{allEvents});
});

app.use("/events",eventRouter);
app.use("/events/:id/reviews",reviewRouter);
app.use("/",userRouter);
app.use("/",bookingRouter);

app.get("/test-500", (req, res, next) => {
    next(new ExpressError(500, "This is a test 500 error"));
});

app.get("/test-403", (req, res, next) => {
    next(new ExpressError(403, "Access denied - This is a test 403 error"));
});

app.use((req,res,next)=>{
    const error = new ExpressError(404,"Page Not found!");
    console.log("Creating 404 error:", error.statusCode, error.message);
    next(error);
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong"}=err;
    console.log("Error details:", {statusCode, message, originalStatus: err.statusCode});
    res.status(statusCode).render("error.ejs",{message, statusCode});  
});

app.listen(port,()=>{
    console.log(`Listening to port : ${port}`);
});