// models/TrafficLight.js
const mongoose = require('mongoose');

const junctionSchema = new mongoose.Schema({
  junctionName: { type: String, required: true },
  centerCoordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  roads: [
    {
      trafficLight: { type: String, required: true },
      boundaryCoordinates: [
        {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
        },
      ],
    },
  ],
});

module.exports = mongoose.model('Junction', junctionSchema);
