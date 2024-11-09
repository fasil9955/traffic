const Junction = require('../models/TrafficLight');

// Helper function to check if a point is inside a polygon (using Ray-casting algorithm)
const isPointInPolygon = (point, polygon) => {
  console.log("lovc", point, polygon);
  
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
  console.log("inside",isInside)

  return isInside;
};

// Function to check if live location is within the traffic light boundary
const checkProximity = async (location, io) => {
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

        // console.log(`Checking traffic light ${trafficLight} with coordinates:`, boundaryCoordinates);

        // Check if the current location is inside the boundary of the traffic light
        if (isPointInPolygon(location, boundaryCoordinates)) {
          console.log(`Live location is within the boundary of traffic light ${trafficLight}`);

          // Emit a message with traffic light data
          io.emit('trafficLightBoundaryMatched', {
            trafficLight,
            junctionName: junction.junctionName,
            boundaryCoordinates,
          });
          return; // Stop once we find the first match
        }
      }
    }
  } catch (error) {
    console.error('Error checking proximity:', error);
  }
};

module.exports = { checkProximity };
