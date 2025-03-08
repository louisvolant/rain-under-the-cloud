const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://"+process.env.MONGODB_ATLAS_USERNAME+":"+MONGODB_ATLAS_PASSWORD+"@"+process.env.MONGODB_ATLAS_CLUSTER_URL+"/"+process.env.MONGODB_ATLAS_DB_NAME+"?retryWrites=true&w=majority&appName="+MONGODB_ATLAS_APP_NAME
console.log('Mongo URI:', process.env.MONGO_URI);

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Define Mongoose Schemas and Models
const weatherOnCallSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    units: String,
    lang: String,
    data: Object,
});
const WeatherOnCallModel = mongoose.model('WeatherOnCall', weatherOnCallSchema, 'WeatherOnCall'); //Third parameter forces the collection name.

const weatherOnCallDaySummarySchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    date: String,
    data: Object,
});
const WeatherOnCallDaySummaryModel = mongoose.model('WeatherOnCallDaySummary', weatherOnCallDaySummarySchema, 'WeatherOnCallDaySummary'); //Third parameter forces the collection name.

async function getWeatherOnCall(lat, lon, param_units, param_lang) {
  try {

    // Check if data already exists in MongoAtlas
    const existingData = await WeatherOnCallModel.findOne({
    latitude: lat,
    longitude: lon,
    units: param_units,
    lang: param_lang
     });
    if (existingData) {
        console.info('Data (WeatherOnCallModel) for lat=' + lat + ', lon=' + lon + ' fetched from Internal MongoDB');
    }
    return existingData;
  } catch (error) {
    console.error('Unexpected error fetching weather onCall:', error);
    throw error;
  }
}

async function saveWeatherOnCall(lat, lon, param_units, param_lang, data) {
  try {
    // Save the new data to MongoDB
    const newWeatherOnCall = new WeatherOnCallModel({
        latitude: lat,
        longitude: lon,
        units: param_units,
        lang: param_lang,
        data: data,
    });

    await newWeatherOnCall.save();
    console.log('Data (newWeatherOnCall) for lat=' + lat + ', lon=' + lon + ' saved to MongoDB');
  } catch (error) {
    console.error('Unexpected error saving weather Day Summary data from internal DB:', error);
    throw error;
  }
}


async function getWeatherOnCallDaySummary(lat, lon, param_date) {
  try {

    // Check if data already exists in MongoAtlas
    const existingData = await WeatherOnCallDaySummaryModel.findOne({
    latitude: lat,
    longitude: lon,
    date: param_date
     });
    if (existingData) {
        console.info('Data (WeatherOnCallDaySummaryModel) for lat=' + lat + ', lon=' + lon + ', date=' + param_date + ' fetched from Internal MongoDB');
    }
    return existingData;
  } catch (error) {
    console.error('Unexpected error fetching weather Day Summary data from internal DB:', error);
    throw error;
  }
}

async function saveWeatherOnCallDaySummary(lat, lon, param_date, data) {
  try {

    // Save the new data to MongoDB
    const weatherOnCallDaySummary = new WeatherOnCallDaySummaryModel({
        latitude: lat,
        longitude: lon,
        date: param_date,
        data: data,
    });

    await weatherOnCallDaySummary.save();
    console.log('Data (weatherOnCallDaySummary) for lat=' + lat + ', lon=' + lon + ', date=' + param_date + ' saved to MongoDB');
  } catch (error) {
    console.error('Unexpected error saving weather Day Summary data from internal DB:', error);
    throw error;
  }
}

module.exports = { getWeatherOnCall, saveWeatherOnCall, getWeatherOnCallDaySummary, saveWeatherOnCallDaySummary };