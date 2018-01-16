const mongoose   = require('mongoose'); // Import Mongoose Package
const Schema     = mongoose.Schema; // Assign Mongoose Schema function to variable
const bcrypt     = require('bcrypt-nodejs'); // Import Bcrypt Package
const titlize    = require('mongoose-title-case'); // Import Mongoose Title Case Plugin
const validate   = require('mongoose-validator'); // Import Mongoose Validator Plugin


let emailValidator = [
    validate({
        validator: 'isEmail',
        message: 'Not a valid e-mail'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'E-mail should be between {ARGS[0]} and {ARGS[1]} charachters'
    })
];

let usernameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 25],
        message: 'Username should be between {ARGS[0]} and {ARGS[1]} charachters'
    })
];

let passwordValidator = [
    validate({
        validator: 'isLength',
        arguments: [8, 50],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} charachters'
    })
];

// User Mongoose Schema
let UserSchema = new Schema({
    name:           {type: String,  required: true},
    username:       {type: String,  required: true, unique: true, validate: usernameValidator},
    password:       {type: String,  required: true, validate: passwordValidator, select: false},
    email:          {type: String,  required: true, lowercase: true, unique: true, validate: emailValidator},
    active:         {type: Boolean, required: true, default: true},
    temporarytoken: {type: String,  required: false},
    resettoken:     {type: String,  required: false},
    permission:     {type: String,  required: true, default: 'user'}
});

// Middleware to ensure password is encrypted before saving user to database
UserSchema.pre('save', function (next)
{
    let user = this;

    if (!user.isModified('password')) return next(); // If password was not changed or is new, ignore middleware

    // Function to encrypt password 
    bcrypt.hash(user.password, null, null, function (err, hash)
    {
        if (err) return next(err); // Exit if error is found
        user.password = hash; // Assign the hash to the user's password so it is saved in database encrypted
        next(); // Exit Bcrypt function
    });
});

// Mongoose Plugin to change fields to title case after saved to database
UserSchema.plugin(titlize, {
    paths: ['name']
});

// Method to compare passwords in API (when user logs in) 
UserSchema.methods.comparePassword = function (password)
{
    return bcrypt.compareSync(password, this.password); // Returns true if password matches, false if doesn't
};

module.exports = mongoose.model('User', UserSchema); // Export User Model for use in API
