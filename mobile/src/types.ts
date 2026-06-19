export type Role = 'seeker' | 'owner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  mobile_number: string | null;
  gender: string | null;
  occupation: string | null;
  role: Role;
  is_verified: boolean;
  profile_image_key: string | null;
  profile_image_url: string | null;
  created_at: string;
}

export interface PropertyImage {
  id: string;
  sort_order: number;
  image_key: string;
  image_url: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  property_type: string;
  rent_amount: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  district: string | null;
  city: string | null;
  is_available: boolean;
  created_at: string;
  distance_km?: number;
  images: PropertyImage[];
  owner: User;
}

export interface RoommatePost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  preferred_location: string | null;
  move_in_date: string | null;
  is_active: boolean;
  created_at: string;
  user: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  property_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  property_id: string | null;
  property: { id: string; title: string; rent_amount: number } | null;
  other_user: User;
  last_message: { content: string; sender_id: string; created_at: string; is_read: boolean } | null;
  unread_count: number;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  status: 'unread' | 'read';
  data: any;
  created_at: string;
}
