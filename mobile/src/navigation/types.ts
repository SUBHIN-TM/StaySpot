import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Explore: undefined;
  Map: undefined;
  Roommates: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList>;
  PropertyDetail: { id: string };
  Chat: { conversationId: string; title?: string };
  CreateProperty: undefined;
  CreateRoommate: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
