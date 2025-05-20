import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

export default function NewsDetailScreen({ route }) {
  const { articles } = route.params;

  // Sort articles by date, most recent first
  const sortedArticles = [...articles].sort((a, b) => {
    return new Date(b.pub_date) - new Date(a.pub_date);
  });

  const handleArticlePress = (article) => {
    if (article.link) {
      Linking.openURL(article.link);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {sortedArticles.map((article, index) => (
        <TouchableOpacity
          key={index}
          style={styles.articleCard}
          onPress={() => handleArticlePress(article)}
        >
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.description}</Text>
          <View style={styles.footer}>
            <Text style={styles.source}>{article.source}</Text>
            <Text style={styles.date}>
              {new Date(article.pub_date).toLocaleDateString()}
            </Text>
          </View>
          {article.link && (
            <Text style={styles.link}>Tap to read full article</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
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
    marginBottom: 8,
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
  link: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
  },
}); 