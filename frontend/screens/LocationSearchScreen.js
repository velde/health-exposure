import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const LocationSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Searching for:', query);
      const results = await Location.geocodeAsync(query);
      console.log('Raw geocoding results:', JSON.stringify(results, null, 2));
      
      if (results && results.length > 0) {
        const detailedResults = await Promise.all(
          results.map(async (result) => {
            try {
              console.log('Getting details for coordinates:', result.latitude, result.longitude);
              const [address] = await Location.reverseGeocodeAsync({
                latitude: result.latitude,
                longitude: result.longitude
              });
              console.log('Address details:', JSON.stringify(address, null, 2));
              
              const formattedName = [
                address.city,
                address.region,
                address.country
              ].filter(Boolean).join(', ');

              return {
                name: formattedName,
                street: address.street,
                lat: result.latitude,
                lon: result.longitude,
                city: address.city,
                region: address.region,
                country: address.country,
                postalCode: address.postalCode
              };
            } catch (err) {
              console.error('Error getting address details:', err);
              return {
                name: query,
                lat: result.latitude,
                lon: result.longitude
              };
            }
          })
        );
        
        const filteredResults = detailedResults.filter(result => {
          const searchableText = [
            result.name,
            result.street,
            result.city,
            result.region,
            result.country
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.split(' ').some(word => 
            word.toLowerCase().includes(query.toLowerCase())
          );
        });
        
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = useCallback((location) => {
    const selectedLocation = {
      name: location.name,
      lat: location.lat,
      lon: location.lon
    };
    
    // Navigate back to dashboard with the selected location
    navigation.navigate('Dashboard', { selectedLocation });
  }, [navigation]);

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        {item.street ? (
          <Text style={styles.locationCountry}>{item.street}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {isLoading && <ActivityIndicator style={styles.loader} />}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderLocationItem}
        keyExtractor={(item) => `${item.lat}-${item.lon}`}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  loader: {
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationCountry: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    color: 'red',
    padding: 16,
    textAlign: 'center',
  },
});

export default LocationSearchScreen; 