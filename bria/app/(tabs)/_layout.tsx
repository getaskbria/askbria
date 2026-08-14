import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.soft,
        tabBarStyle: {
          backgroundColor: Colors.warmWhite,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: Spacing[1],
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => null, // TODO: add expo-symbols icons
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Ask Bria',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="supplies"
        options={{
          title: 'Supplies',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => null,
        }}
      />
    </Tabs>
  );
}
