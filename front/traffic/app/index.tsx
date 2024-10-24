// index.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRouter } from 'expo-router';

interface Hospital {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export default function SelectHospitalScreen() {
  // Hardcoded hospital data
  const hospitals: Hospital[] = [
    { id: 1, name: 'Hospital A', latitude: 12.914142, longitude: 74.855957 },
    { id: 2, name: 'Hospital B', latitude: 34.052235, longitude: -118.243683 },
    { id: 3, name: 'Hospital C', latitude: 37.774929, longitude: -122.419418 },
  ];

  // State variables for dropdown picker
  const [open, setOpen] = useState(false); // Controls whether the dropdown is open
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null); // Currently selected hospital value
  const router = useRouter();

  const handleStartJourney = () => {
    if (selectedHospital) {
      const hospital = hospitals.find(h => h.name === selectedHospital); // Find the selected hospital from the list
      if (hospital) {
        // Navigate to the MapScreen with selected hospital data
        router.push({
          pathname: '/map',
          params: {
            name: hospital.name,
            latitude: hospital.latitude.toString(), // Convert to string to avoid type issues
            longitude: hospital.longitude.toString(), // Convert to string to avoid type issues
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

      <DropDownPicker
        open={open} // Whether the dropdown is open
        value={selectedHospital} // Current selected value
        items={hospitals.map(hospital => ({
          label: hospital.name,
          value: hospital.name,
        }))} // Convert hospitals data to dropdown items
        setOpen={setOpen} // Function to set the open state
        setValue={setSelectedHospital} // Function to set the selected value
        placeholder="Select a hospital..." // Placeholder text
        searchable={true} // Enable searching
        searchPlaceholder="Search for a hospital..." // Placeholder for search input
        style={styles.picker} // Picker style
        containerStyle={styles.pickerContainer} // Container style
        dropDownContainerStyle={styles.dropDownContainer} // Dropdown container style
        listMode="SCROLLVIEW" // Allows scrolling for the dropdown list
      />

      <TouchableOpacity style={styles.button} onPress={handleStartJourney}>
        <Text style={styles.buttonText}>Start Journey</Text>
      </TouchableOpacity>
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
