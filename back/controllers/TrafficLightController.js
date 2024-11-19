const Junction = require('../models/TrafficLight');

// Helper function to check if a point is inside a polygon (using Ray-casting algorithm)
const isPointInPolygon = (point, polygon) => {
  let isInside = false;
  const x = point.latitude, y = point.longitude;

  // Loop through the polygon vertices (ignoring any other properties like _id)
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }

  return isInside;
};

// Helper function to calculate the distance between two geographical coordinates using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Function to check if the live location is within 10 meters of the junction center
const isWithin10Meters = (location, junctionCenter) => {
  const distance = calculateDistance(location.latitude, location.longitude, junctionCenter.latitude, junctionCenter.longitude);
  return distance <= 10; // Returns true if within 10 meters
};

// Maintain a Set to track traffic lights for which messages have already been sent
const processedTrafficLights = new Set();

// Function to check if live location is within the traffic light boundary
const checkProximity = async (location, adminNamespace) => {
  try {
    console.log("Checking proximity...");

    // Find the junctions from the database
    const junctions = await Junction.find();
    console.log("Found junctions:", junctions);

    // Iterate through each junction and its roads
    for (const junction of junctions) {
      console.log(`Checking roads for junction: ${junction.junctionName}`);

      // Iterate through the roads in the junction
      for (const road of junction.roads) {
        const { trafficLight, boundaryCoordinates } = road;

        // Check if the current location is inside the boundary of the traffic light
        if (isPointInPolygon(location, boundaryCoordinates)) {
          console.log(`Live location is within the boundary of traffic light ${trafficLight}`);

          // Check if this traffic light has already been processed
          if (!processedTrafficLights.has(trafficLight)) {
            processedTrafficLights.add(trafficLight); // Mark this traffic light as processed

            adminNamespace.emit('trafficLightBoundaryMatched', {
              message: `Traffic light ${trafficLight} matched for junction ${junction.junctionName}`,
              trafficLight,
              junctionName: junction.junctionName,
            });

            // Start a 1-minute timer to turn off the traffic light
           setTimeout(() => {
              console.log(`1 minute passed, turning off traffic light at junction: ${junction.junctionName}`);

              adminNamespace.emit('turnOffTrafficLight', {
                trafficLight,
                junctionName: junction.junctionName,
              });

              // Optionally, remove the traffic light from the processed set if you want to allow re-processing after turn-off
              processedTrafficLights.delete(trafficLight);
            }, 60000); // 60000 milliseconds = 1 minute
          } else {
            console.log(`Message for traffic light ${trafficLight} already sent. Skipping.`);
          }

          return; // Stop once we find the first match
        }
      }
    }
  } catch (error) {
    console.error('Error checking proximity:', error);
  }
};

module.exports = { checkProximity };
