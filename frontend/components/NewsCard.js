import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RECENT_DAYS = 30; // Show articles from last 30 days in the card

export default function NewsCard({ articles }) {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = new Animated.Value(1);

  // Filter articles to only show recent ones in the card
  const recentArticles = articles?.filter(article => {
    const pubDate = new Date(article.pub_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RECENT_DAYS);
    return pubDate >= thirtyDaysAgo;
  }) || [];

  if (!articles || articles.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.noNewsText}>No health news available for this location</Text>
      </View>
    );
  }

  if (recentArticles.length === 0) {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('NewsDetail', { articles })}
      >
        <Text style={styles.noNewsText}>No recent health news in the past {RECENT_DAYS} days</Text>
        <Text style={styles.clickText}>Click to view older news</Text>
      </TouchableOpacity>
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Update index
        setCurrentIndex((prevIndex) => (prevIndex + 1) % recentArticles.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [recentArticles.length]);

  const currentArticle = recentArticles[currentIndex];
  const { title, description, source, pub_date, link } = currentArticle;

  const handlePress = () => {
    navigation.navigate('NewsDetail', { articles });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
    >
      <Animated.Text 
        style={[styles.title, { opacity: fadeAnim }]} 
        numberOfLines={2}
      >
        {title}
      </Animated.Text>
      <Text style={styles.description} numberOfLines={3}>{description}</Text>
      <View style={styles.footer}>
        <Text style={styles.source}>{source}</Text>
        <Text style={styles.date}>{new Date(pub_date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noNewsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  clickText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
}); 