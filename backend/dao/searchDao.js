const mongoose = require('mongoose');

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Define Mongoose Schemas and Models
const locationSearchSchema = new mongoose.Schema({
    city: String,
    lang: String,
    data: Object,
});
const LocationSearchModel = mongoose.model('LocationSearch', locationSearchSchema, 'LocationSearch'); //Third parameter forces the collection name.

async function getLocationSearch(param_city, param_lang) {
  try {

    // Check if data already exists in MongoAtlas
    const existingData = await LocationSearchModel.findOne({
        city: param_city,
        lang: param_lang
     });
    if (existingData) {
        console.info('Data (LocationSearchModel) for city=' + param_city + ', lang=' + param_lang + ' fetched from Internal MongoDB');
    }
    return existingData;
  } catch (error) {
    console.error('Unexpected error fetching Location Search:', error);
    throw error;
  }
}

async function saveLocationSearch(param_city, param_lang, data) {
  try {
    // Save the new data to MongoDB
    const newLocationSearch = new LocationSearchModel({
        city: param_city,
        lang: param_lang,
        data: data,
    });

    await newLocationSearch.save();
    console.log('Data (newLocationSearch) for city=' + param_city + ', lang=' + param_lang + ' saved to MongoDB');
  } catch (error) {
    console.error('Unexpected error saving Location Search data from internal DB:', error);
    throw error;
  }
}

module.exports = { getLocationSearch, saveLocationSearch };