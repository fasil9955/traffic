// index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';

interface Hospital {
  _id: string; // MongoDB ObjectId as a string
  name: string;
  latitude: number;
  longitude: number;
}

export default function SelectHospitalScreen() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]); // State for hospital data
  const [loading, setLoading] = useState<boolean>(true); // State for loading status
  const [open, setOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const router = useRouter();

  // Fetch hospitals from the backend
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
      const response = await axios.get('https://traffic-51jp.onrender.com/hospitals'); // Replace with your backend URL
    //    const response = await axios.get('http://172.21.7.224:3000/hospitals'); // Replace with your backend URL

        setHospitals(response.data); // Set the fetched hospitals in state
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch hospitals'); // Handle errors
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchHospitals(); // Call the fetch function
  }, []);

  const handleStartJourney = () => {
    if (selectedHospital) {
      const hospital = hospitals.find(h => h.name === selectedHospital);
      if (hospital) {
        router.push({
          pathname: '/map',
          params: {
            name: hospital.name,
            latitude: hospital.latitude.toString(),
            longitude: hospital.longitude.toString(),
          },
        });
      }
    } else {
      alert('Please select a hospital');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Hospital</Text>

      {loading ? ( // Show loading indicator while fetching data
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <DropDownPicker
            open={open}
            value={selectedHospital}
            items={hospitals.map(hospital => ({
              label: hospital.name,
              value: hospital.name,
            }))}
            setOpen={setOpen}
            setValue={setSelectedHospital}
            placeholder="Select a hospital..."
            searchable={true}
            searchPlaceholder="Search for a hospital..."
            style={styles.picker}
            containerStyle={styles.pickerContainer}
            dropDownContainerStyle={styles.dropDownContainer}
            listMode="SCROLLVIEW"
          />

          <TouchableOpacity style={styles.button} onPress={handleStartJourney}>
            <Text style={styles.buttonText}>Start Journey</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
    width: '100%',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
  },
  dropDownContainer: {
    borderWidth: 1,
    borderColor: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
