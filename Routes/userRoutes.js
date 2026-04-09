const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.js");
const { wrapAsync, saveRedirectUrl, isAdmin } = require("../middleware.js"); 
const passport = require("passport");

router.route("/signup")
    .get(userController.renderSignup)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLogin)
    .post(
        saveRedirectUrl, 
        passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), 
        userController.login
    );

router.get("/logout", userController.logout);
router.get("/profile", userController.renderProfile);
router.get("/admin/dashboard", isAdmin, wrapAsync(userController.renderAdminDashboard));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.flash("success", "Welcome to Roavista via Google!");
        res.redirect('/listings');
    }
);

module.exports = router;