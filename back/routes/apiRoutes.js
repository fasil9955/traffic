// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const { getHospitals } = require('../controllers/hopitalController');
const { getTrafficLights } = require('../controllers/TrafficLightController');

// Route to get all hospitals
router.get('/hospitals', getHospitals);

// Route to get all traffic lights (optional, mainly for testing or internal use)
router.get('/traffic-lights', async (req, res) => {
  try {
    const trafficLights = await getTrafficLights();
    res.status(200).json(trafficLights);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching traffic lights' });
  }
});

module.exports = router;
