import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getDb } from "@/db/database";
import { requestNotificationPermissions } from "@/notifications/scheduler";
import RootNavigator from "@/navigation/RootNavigator";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getDb(); // opens SQLite connection, runs schema migrations
      await requestNotificationPermissions();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );
}
