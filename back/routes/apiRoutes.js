// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const { getHospitals } = require('../controllers/hopitalController');
const { getTrafficLights } = require('../controllers/TrafficLightController');

// Route to get all hospitals
router.get('/hospitals', getHospitals);

// Route to get all traffic lights (optional, mainly for testing or internal use)


module.exports = router;
