import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const COLORS = {
  high: '#e63946',
  moderate: '#f1c40f',
  low: '#2ecc71'
};

export default function RiskRow({ type, risk, onPress }) {
  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: COLORS[risk] || '#ccc' }]} onPress={onPress}>
      <Text style={styles.text}>{type}</Text>
      <Text style={styles.risk}>{risk.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8
  },
  text: { color: '#fff', fontSize: 16, fontWeight: '500' },
  risk: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});