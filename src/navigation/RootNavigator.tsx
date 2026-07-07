import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TodayScreen from "@/screens/TodayScreen";
import StatsScreen from "@/screens/StatsScreen";
import CaptureTaskScreen from "@/screens/CaptureTaskScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TodayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TodayList" component={TodayScreen} options={{ title: "Today" }} />
      <Stack.Screen name="Capture" component={CaptureTaskScreen} options={{ title: "New Task" }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Today" component={TodayStack} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ headerShown: true }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
