import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayScreen } from './screens/TodayScreen';
import { TasksScreen } from './screens/TasksScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TaskEditScreen } from './screens/TaskEditScreen';
import { colors, type } from './theme';

export type RootStackParamList = {
  Tabs: undefined;
  TaskEdit: { taskId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.card,
    text: colors.ink,
    border: colors.rule,
    primary: colors.pine,
  },
};

const ICONS: Record<string, string> = { Today: '◆', Tasks: '≡', Stats: '▤', Settings: '⚙' };

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.pine,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.rule },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>{ICONS[route.name] ?? '•'}</Text>,
      })}
    >
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Tasks" component={TasksScreen} />
      <Tabs.Screen name="Stats" component={StatsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export function Navigation() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { ...type.body, fontWeight: '700' },
          headerTintColor: colors.pine,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="TaskEdit"
          component={TaskEditScreen}
          options={{ title: 'Task', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
