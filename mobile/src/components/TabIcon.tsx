import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Explore: 'search',
  Map: 'map',
  Roommates: 'people',
  Chats: 'chatbubbles',
  Profile: 'person',
};

export function TabIcon({ route, color, size }: { route: string; color: string; size: number }) {
  return <Ionicons name={MAP[route] || 'ellipse'} size={size} color={color} />;
}
