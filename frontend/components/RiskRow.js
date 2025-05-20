import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  high: '#e63946',
  moderate: '#f1c40f',
  low: '#2ecc71'
};

const ICONS = {
  'Air Quality': 'air-filter',
  'UV Index': 'white-balance-sunny',
  'Pollen': 'flower',
  'Humidity': 'water-percent',
  'Tap Water': 'water-check'
};

export default function RiskRow({ type, risk, onPress }) {
  const iconName = ICONS[type] || 'alert-circle';
  
  return (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: COLORS[risk] || '#ccc' }]} 
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name={iconName} size={24} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{type}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.risk}>{risk.toUpperCase()}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
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
  text: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '500',
  },
  risk: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold',
    marginRight: 8,
  }
});