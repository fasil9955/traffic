//controllers/trafficLightController.js
const TrafficLight = require('../models/TrafficLight');
const geolib = require('geolib');

// Store traffic lights
exports.getTrafficLights = async () => {
  return await TrafficLight.find({});
};

// Function to check distance and send a green light signal if within range
exports.checkProximity = async (currentLocation, io) => {
  const trafficLights = await TrafficLight.find({});
  for (const light of trafficLights) {
    const distance = geolib.getDistance(currentLocation, {
      latitude: light.latitude,
      longitude: light.longitude,
    });

    if (distance <= 600) {
      io.emit('greenSignal', { trafficLightId: light._id });
    }
  }
};
