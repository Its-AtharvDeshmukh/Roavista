if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const engine = require('ejs-mate');
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require("./models/user.js");

//-----------------------IMPORT ROUTES----------------------------//
    const listingRoutes = require("./Routes/listingRoutes.js");
    const reviewRoutes = require("./Routes/reviewRoutes.js");
    const userRoutes = require("./Routes/userRoutes.js");
    const bookingRoutes = require("./Routes/bookingRoutes.js");
//-----------------------------------------------------------------//

//------------------------ DATABASE --------------------------------//
    const dbUrl = process.env.ATLASDB_URL;
    async function main() { await mongoose.connect(dbUrl); }
    main().then(() => console.log("Connected to DB")).catch(err => console.log("DB Error:", err));

    // app.listen(8080, () => console.log("Roavista Server running on port 8080"));
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`Roavista Server running on port ${port}`);
    });
//--------------------------------------------------------------------//

//-------------------------- APP CONFIG ------------------------------//
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));
    app.use(express.urlencoded({ extended: true }));
    app.use(methodOverride("_method"));
    app.engine('ejs', engine);
    app.use(express.static(path.join(__dirname, "Public")));
//--------------------------------------------------------------------//

//-------------------------- SESSION & FLASH ------------------------------//
    const sessionOptions = {
        secret: process.env.SESSION_SECRET || "roavistaSuperSecretCode",
        resave: false, 
        saveUninitialized: false, // Changed to false! Saves database memory.
        cookie: { 
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7, 
            maxAge: 1000 * 60 * 60 * 24 * 7, 
            httpOnly: true,
            // ONLY IN PRODUCTION: secure: true ensures cookies are only sent over HTTPS
            secure: process.env.NODE_ENV === "production" 
        }
    };
//--------------------------------------------------------------------//

app.use(session(sessionOptions));
app.use(flash());

//--------------------------------- PASSPORT AUTH --------------------------------------------//
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (user) return done(null, user);
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) { user.googleId = profile.id; await user.save(); return done(null, user); }
            const newUser = new User({
                googleId: profile.id,
                username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
                email: profile.emails[0].value
            });
            const savedUser = await newUser.save();
            done(null, savedUser);
        } catch (err) { done(err, null); }
    }
    ));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

//------------------------------ LOCALS & ADMIN SHIELD ------------------------------------//
const ADMIN_USERS = process.env.ADMIN_LIST ? process.env.ADMIN_LIST.split(',') : [];
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null; 
    res.locals.mapToken = process.env.MAPBOX_TOKEN; 
    res.locals.isAdmin = req.user ? ADMIN_USERS.includes(req.user.username) : false;
    next();
});

//------------------------------ URI ERROR SHIELD ------------------------------//
app.use((req, res, next) => {
    try { decodeURIComponent(req.path); next(); } 
    catch (err) { return res.status(400).send("Bad Request."); }
});


//------------------------------ ROUTING ----------------------------------------//
    app.get("/", (req, res) => res.redirect("/listings"));
    app.get("/explore", require("./controllers/listings").exploreListings);
    app.use("/listings", listingRoutes);
    app.use("/listings/:id/reviews", reviewRoutes);
    app.use("/", userRoutes);
    app.use("/", bookingRoutes);


//------------------------------ STATIC INFO PAGES ------------------------------//
    app.get("/privacy", (req, res) => res.render("Info/Privacy.ejs"));
    app.get("/terms", (req, res) => res.render("Info/Terms.ejs"));
    app.get("/creators", (req, res) => res.render("Info/creators.ejs"));


//------------------------------ GLOBAL ERRORS ----------------------------------//
    app.use((err, req, res, next) => {
        if (err.message === 'File too large' || err.code === 'LIMIT_FILE_SIZE') {
            req.flash("error", "Image too large! Use pictures under 10MB.");
            return res.redirect("/listings/new");
        }
        if (err.name === 'CastError') {
            req.flash("error", "The sanctuary requested does not exist.");
            return res.redirect("/listings");
        }
        let { statusCode = 500 } = err;
        console.error(err); 
        res.status(statusCode).render("listings/error.ejs", { err }); 
    });


app.all(/(.*)/, (req, res, next) => {
    req.flash("error", "Page not found.");
    res.redirect("/listings");
});