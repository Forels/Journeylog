const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tripSchema = new Schema({
    countryName: String,
    googleId: String,
    userId: String,
    tripStart: Date,
    tripEnd: Date
});

const Trip = mongoose.model('trip', tripSchema);

module.exports = Trip;

