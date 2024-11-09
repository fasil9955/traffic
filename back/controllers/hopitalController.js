// controllers/hospitalController.js
const Hospital = require('../models/Hospital');

// Get all hospitals
exports.getHospitals = async (req, res) => {
  try {
    console.log("reached here")
    const hospitals = await Hospital.find({});
    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching hospitals' });
  }
};
