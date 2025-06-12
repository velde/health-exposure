import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICONS = {
  'Air Quality': 'air-filter',
  'UV Index': 'white-balance-sunny',
  'Pollen': 'flower',
  'Humidity': 'water-percent',
  'Tap Water': 'water-check'
};

export default function DetailScreen({ route }) {
  const { title, data } = route.params;
  const iconName = ICONS[title] || 'alert-circle';

  const renderData = () => {
    if (!data || typeof data !== 'object') return <Text style={styles.text}>No data available.</Text>;

    return Object.entries(data).map(([key, value], idx) => (
      <View key={idx} style={styles.row}>
        <Text style={styles.key}>{formatKey(key)}</Text>
        <Text style={styles.value}>{formatValue(value)}</Text>
      </View>
    ));
  };

  const formatKey = (key) => {
    const keyMap = {
      'aqi': 'Air Quality Index',
      'pm2_5': 'PM2.5',
      'pm10': 'PM10',
      'o3': 'Ozone',
      'co': 'Carbon Monoxide',
      'uv_index': 'UV Index',
      'birch': 'Birch Pollen',
      'grass': 'Grass Pollen',
      'mugwort': 'Mugwort Pollen',
      'olive': 'Olive Pollen',
      'ragweed': 'Ragweed Pollen',
      'relative_humidity': 'Relative Humidity',
      'safe': 'Water Safety',
      'timestamp': 'Last Updated'
    };
    return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      if (val === Math.round(val)) return val.toString();
      return val.toFixed(2);
    }
    if (typeof val === 'string' && val.length > 10 && val.includes('T')) {
      return new Date(val).toLocaleString();
    }
    if (typeof val === 'boolean') {
      return val ? 'Safe' : 'Not Safe';
    }
    return val.toString();
  };

  const getDescription = () => {
    switch (title) {
      case 'Air Quality':
        return 'Air quality index and pollutant levels in your area.';
      case 'UV Index':
        return 'Current UV radiation levels and sun protection recommendations.';
      case 'Pollen':
        return 'Current pollen levels for different types of allergens.';
      case 'Humidity':
        return 'Current humidity levels and their impact on health.';
      case 'Tap Water':
        return 'Information about tap water safety in your area.';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={iconName} size={32} color="#333" style={styles.headerIcon} />
      <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{getDescription()}</Text>
      </View>
      <View style={styles.content}>
      {renderData()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  key: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  text: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  }
});