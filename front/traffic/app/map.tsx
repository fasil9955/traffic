// map.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://192.168.1.101:3000'; // Replace with your server URL

export default function MapScreen() {
  const router = useRouter();
  const { name, latitude, longitude } = useLocalSearchParams();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false); // Track journey state
  const [showStartButton, setShowStartButton] = useState(true); // Control button visibility
  const [distance, setDistance] = useState<number | null>(null); // Track distance
  const [duration, setDuration] = useState<number | null>(null); // Track duration
  const mapRef = React.useRef<MapView>(null); // Reference to MapView

  const destinationCoordinates = {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  };

  // Fetch user's current location
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
         latitude: location.coords.latitude,
         longitude: location.coords.longitude,
       
      });
    };

    getLocation();
  }, []);

  // Set up socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Function to share live location
  const shareLiveLocation = () => {
    if (socket && currentLocation) {
      socket.emit('liveLocation', currentLocation);  
     console.log('Live location shared:', currentLocation);
    }
  };

  //function to share route
  const shareRoute = () => {
    if (socket && routePolyline) {
      socket.emit('routeCoordinates', decodePolyline(routePolyline));
    } else {
      console.error("routePolyline is null");
    }
  } 

  // Function to check if the destination is reached
  const checkDestinationReached = () => {
    if (currentLocation) {
      const distanceToDestination = getDistance(currentLocation, destinationCoordinates);
      if (distanceToDestination < 50) { // Assuming 50 meters as the threshold to consider "reached"
        Alert.alert('Arrived!', 'You have reached your destination.');
        setIsJourneyStarted(false);
        return true;
      }
    }
    return false;
  };

  // Function to get distance between two coordinates
  const getDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }) => {
    const R = 6371000; // meters
    const φ1 = coord1.latitude * (Math.PI / 180);
    const φ2 = coord2.latitude * (Math.PI / 180);
    const Δφ = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
    const Δλ = (coord2.longitude - coord1.longitude) * (Math.PI / 180);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };

  // Function to fetch directions from Ola Maps API
  const fetchDirections = async () => {
    if (!currentLocation) {
      console.log('Current location not set.');
      return;
    }

    const apiKey = 'CxuNdfttxCeKSlEa2hP5rwnwI3lJI4JMZotfvRdy';
    const bearerToken = 'YOUR_BEARER_TOKEN_HERE';

    const locations = `${currentLocation.latitude},${currentLocation.longitude}|${destinationCoordinates.latitude},${destinationCoordinates.longitude}`;
    const xRequestId = uuidv4();
    const xCorrelationId = uuidv4();

    try {
      const response = await fetch(
        `https://api.olamaps.io/routing/v1/routeOptimizer?locations=${encodeURIComponent(
          locations
        )}&source=first&destination=last&round_trip=false&mode=driving&steps=true&overview=full&language=en&traffic_metadata=false&api_key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'X-Request-Id': xRequestId,
            'X-Correlation-Id': xCorrelationId,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (response.ok && data.routes?.[0]?.overview_polyline) {
        setRoutePolyline(data.routes[0].overview_polyline);
        setDistance(data.routes[0].distance); // Set distance
        setDuration(data.routes[0].duration); // Set duration
      
      } else {
        Alert.alert('Error', data.reason || 'Unable to fetch directions.');
      }
    } catch (error) {
      console.log('Error fetching directions:', error);
      Alert.alert('Error', 'Failed to connect to the Directions API.');
    }
  };

  // Fetch directions when the component mounts or current location changes
  useEffect(() => {
    if (currentLocation) {
      fetchDirections();
      // Share live location every 5 seconds if the journey has started
      const intervalId = setInterval(() => {
        if (isJourneyStarted && !checkDestinationReached()) {
          shareLiveLocation();
        }
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [currentLocation, isJourneyStarted]);

  const handleStartJourney = () => {
    if (!isJourneyStarted) {
      setIsJourneyStarted(true);
      setShowStartButton(false); // Hide the start button
      shareRoute();

      // Zoom to the current location
      if (mapRef.current && currentLocation) {
        mapRef.current.animateToRegion(
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000 // Animation duration in milliseconds
        );
      }

      Alert.alert('Journey Started!', 'You have started your journey.');
    }
  };

  const handleBackPress = () => {
    setIsJourneyStarted(false);
    // Optionally, add code to stop sharing the location
    Alert.alert('Journey Ended!', 'You have stopped sharing your live location.');
    router.push('/'); // Navigate back
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Screen</Text>

      <TouchableOpacity style={styles.backButtonContainer} onPress={handleBackPress}>
        <View style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </View>
      </TouchableOpacity>

      {errorMsg ? (
        <Text>{errorMsg}</Text>
      ) : (
        currentLocation && (
          <MapView
            ref={mapRef} // Attach the ref to MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
              title="You are here"
            />
            <Marker
              coordinate={destinationCoordinates}
              title={typeof name === 'string' ? name : String(name)}
            />
            {routePolyline && (
              <Polyline
                coordinates={decodePolyline(routePolyline)}
                strokeWidth={4}
                strokeColor="hotpink"
               
                
              />
            )}
            
          </MapView>
        )
      )}

      {showStartButton && (
        <TouchableOpacity
          style={styles.startJourneyButton}
          onPress={handleStartJourney}
        >
          <Text style={styles.startJourneyButtonText}>Start Journey</Text>
        </TouchableOpacity>
      )}

{isJourneyStarted && (
    <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
            Distance: {distance ? `${(distance / 1000).toFixed(2)} km` : '...'}
        </Text>
        <Text style={styles.infoText}>
            Estimated Time: {duration ? `${Math.ceil(duration / 60)} min` : '...'}
        </Text>
    </View>
)}
    </View>
  );
}

// Function to decode the polyline into coordinates
const decodePolyline = (encoded: string) => {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
    width: 100,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  startJourneyButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 25,
  },
  startJourneyButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
    width: '90%',
  },
  infoText: {
    fontSize: 16,
  },
});
