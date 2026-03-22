import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { height: 70, paddingBottom: 10 ,paddingTop: 10 } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: 'saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}