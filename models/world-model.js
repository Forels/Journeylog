const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const worldSchema = new Schema({
    Country: String,
    Abbreviation: String,
    Capital: String,
    CurrencyCode: String,
    OfficialLanguage: String
});

const World = mongoose.model('world', worldSchema);

module.exports = World;