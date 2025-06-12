import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Animated, RefreshControl, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HEALTH_EXPOSURE_API_KEY } from '@env';
import RiskRow from './components/RiskRow';
import NewsCard from './components/NewsCard';
import DetailScreen from './screens/DetailScreen';
import NewsDetailScreen from './screens/NewsDetailScreen';
import LocationSearchScreen from './screens/LocationSearchScreen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Verify environment variable
console.log('Environment check - API Key:', HEALTH_EXPOSURE_API_KEY ? 'Present' : 'Missing');

const Stack = createNativeStackNavigator();

function DashboardScreen({ navigation, route }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationText, setLocationText] = useState('📍 Detecting location...');
  const [lastRefresh, setLastRefresh] = useState(0);
  const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds
  const scrollY = useRef(new Animated.Value(0)).current;
  const refreshTriggered = useRef(false);

  const fetchData = async (latitude, longitude) => {
    try {
      const url = `https://dokrd0asw0.execute-api.eu-north-1.amazonaws.com/cells?lat=${latitude}&lon=${longitude}`;

      console.log('Fetching from URL:', url);
      console.log('Using API key:', HEALTH_EXPOSURE_API_KEY ? 'Present' : 'Missing');

      const response = await fetch(url, {
        headers: { 
          'x-user-tier': 'premium',
          'x-api-key': HEALTH_EXPOSURE_API_KEY,
          'origin': 'exp://localhost:19000'
        }
      });

      console.log('Response status:', response.status);
      const json = await response.json();
      console.log('Response data:', json);

      if (!response.ok) {
        throw new Error(`API error: ${json.error || response.statusText}`);
      }

      console.log('News data:', json.news);
      setData({
        ...json.data,
        news: json.news
      });
      console.log('Updated state data:', {
        ...json.data,
        news: json.news
      });
      setLastRefresh(Date.now());
      setLocationText(
        json.location
          ? json.location
          : `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`
      );
    } catch (err) {
      console.error('Error fetching data:', err);
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefresh;
    
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const minutesLeft = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 60000);
      Alert.alert(
        'Please wait',
        `Data can be refreshed every 5 minutes. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
      );
      return;
    }

    setRefreshing(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      await fetchData(loc.coords.latitude, loc.coords.longitude);
    } catch (err) {
      console.error('Error refreshing:', err);
      setRefreshing(false);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY < -100 && !refreshTriggered.current) {
          refreshTriggered.current = true;
          onRefresh();
        } else if (offsetY >= 0) {
          refreshTriggered.current = false;
        }
      }
    }
  );

  useEffect(() => {
    if (route.params?.selectedLocation) {
      const { name, lat, lon } = route.params.selectedLocation;
      setLocationText(name);
      fetchData(lat, lon);
    } else {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required for this app to function.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
          await fetchData(loc.coords.latitude, loc.coords.longitude);
      } catch (err) {
        console.error('Error fetching or locating:', err);
        setLoading(false);
        setLocationText('📍 Location error');
      }
    })();
    }
  }, [route.params?.selectedLocation]);

  const riskRank = { high: 0, moderate: 1, low: 2 };

  const determineRisk = (type, value) => {
    if (value == null) return 'low';
    if (type === 'air_quality') return value.aqi >= 4 ? 'high' : value.aqi === 3 ? 'moderate' : 'low';
    if (type === 'uv') return value.uv_index > 6 ? 'high' : value.uv_index > 3 ? 'moderate' : 'low';
    if (type === 'pollen') return (value.birch || 0) > 100 ? 'high' : (value.birch || 0) > 20 ? 'moderate' : 'low';
    if (type === 'tap_water') {
      console.log('Tap water value:', value);
      return value.safe === true ? 'low' : 'moderate';
    }
    if (type === 'humidity') return value.humidity > 60 ? 'high' : value.humidity < 30 ? 'low' : 'moderate';
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
    { label: 'Air Quality', type: 'air_quality', value: data?.air_quality },
    { label: 'UV Index', type: 'uv', value: data?.uv },
    { label: 'Pollen', type: 'pollen', value: data?.pollen },
    { label: 'Humidity', type: 'humidity', value: data?.humidity },
    { label: 'Tap Water', type: 'tap_water', value: data?.tap_water }
  ];

  const sortedRisks = risks
    .map(item => ({ ...item, risk: determineRisk(item.type, item.value) }))
    .sort((a, b) => riskRank[a.risk] - riskRank[b.risk]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Health Exposure</Text>
      <TouchableOpacity 
        style={styles.locationContainer}
        onPress={() => navigation.navigate('LocationSearch')}
      >
        <View style={styles.leftContent}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#fff" style={styles.icon} />
          <View>
            <Text style={styles.locationText}>{locationText}</Text>
            <Text style={styles.locationSubtext}>Tap to change location</Text>
          </View>
        </View>
        <View style={styles.rightContent}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            enabled={Date.now() - lastRefresh >= REFRESH_COOLDOWN}
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Risks</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Health News</Text>
          <NewsCard articles={data.news?.articles || []} />
        </View>
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen}
          options={({ route }) => ({ 
            title: route.params.title,
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTintColor: '#333',
          })}
        />
        <Stack.Screen 
          name="NewsDetail" 
          component={NewsDetailScreen}
          options={{
            title: 'News Article',
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTintColor: '#333',
          }}
        />
        <Stack.Screen 
          name="LocationSearch" 
          component={LocationSearchScreen}
          options={{
            presentation: 'modal',
            title: 'Search Location',
            headerStyle: {
              backgroundColor: '#fff',
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#333',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 8 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            ),
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
            },
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 8,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#4a90e2', // Subtle blue background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  locationSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});