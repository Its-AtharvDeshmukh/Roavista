const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// ADDED .default at the end to fix the "got object" error
const passportLocalMongoose = require("passport-local-mongoose").default; 
// const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true } // Support for Google Auth
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);