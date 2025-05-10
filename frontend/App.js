import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiskRow from './components/RiskRow';
import DetailScreen from './screens/DetailScreen';

const Stack = createNativeStackNavigator();

function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationText, setLocationText] = useState('📍 Detecting location...');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required for this app to function.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        const url = `https://dokrd0asw0.execute-api.eu-north-1.amazonaws.com/cells?lat=${latitude}&lon=${longitude}`;

        const response = await fetch(url, {
          headers: { 'x-user-tier': 'premium' }
        });

        const json = await response.json();
        setData(json.data);

        // Update displayed location using backend-supplied value
        setLocationText(
          json.location
            ? `📍 ${json.location}`
            : `📍 Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`
        );

        setLoading(false);
      } catch (err) {
        console.error('Error fetching or locating:', err);
        setLoading(false);
        setLocationText('📍 Location error');
      }
    })();
  }, []);

  const riskRank = { high: 0, moderate: 1, low: 2 };

  const determineRisk = (type, value) => {
    if (value == null) return 'low';
    if (type === 'air_quality') return value.aqi >= 4 ? 'high' : value.aqi === 3 ? 'moderate' : 'low';
    if (type === 'uv') return value.uv_index > 6 ? 'high' : value.uv_index > 3 ? 'moderate' : 'low';
    if (type === 'pollen') return (value.birch || 0) > 100 ? 'high' : (value.birch || 0) > 20 ? 'moderate' : 'low';
    return 'low';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading data…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Error loading data.</Text>
      </View>
    );
  }

  const risks = [
    { label: 'Air Quality', type: 'air_quality', value: data.air_quality },
    { label: 'UV Index', type: 'uv', value: data.uv },
    { label: 'Pollen', type: 'pollen', value: data.pollen },
    { label: 'Humidity', type: 'humidity', value: data.humidity }
  ];

  const sortedRisks = risks
    .map(item => ({ ...item, risk: determineRisk(item.type, item.value) }))
    .sort((a, b) => riskRank[a.risk] - riskRank[b.risk]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Health Exposure</Text>
      <Text style={styles.location}>{locationText}</Text>
      <ScrollView style={{ marginTop: 16 }}>
        {sortedRisks.map((item, idx) => (
          <RiskRow
            key={idx}
            type={item.label}
            risk={item.risk}
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.label,
                data: item.value
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold' },
  location: { marginTop: 8, fontSize: 16, color: '#555' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});