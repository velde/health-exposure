import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function DetailScreen({ route }) {
  const { title, data } = route.params;

  const renderData = () => {
    if (!data || typeof data !== 'object') return <Text style={styles.text}>No data available.</Text>;

    return Object.entries(data).map(([key, value], idx) => (
      <View key={idx} style={styles.row}>
        <Text style={styles.key}>{formatKey(key)}</Text>
        <Text style={styles.value}>{formatValue(value)}</Text>
      </View>
    ));
  };

  const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'string' && val.length > 10 && val.includes('T')) return new Date(val).toLocaleString();
    return val.toString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {renderData()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 4
  },
  key: {
    fontWeight: '600',
    color: '#333'
  },
  value: {
    fontFamily: 'Courier',
    color: '#444'
  },
  text: {
    color: '#666'
  }
});