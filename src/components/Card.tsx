import React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  title?: string;
  children: React.ReactNode;
}

export default function Card({ title, children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    margin: 10,
  },
  title: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
