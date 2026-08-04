import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from './src/state/AppContext';
import { Navigation } from './src/navigation';
import { attachEngagementListener } from './src/services/notifications';
import { colors, type } from './src/theme';

function Root() {
  const { ready } = useApp();

  useEffect(() => attachEngagementListener(), []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.wordmark}>FocusFlow</Text>
        <ActivityIndicator color={colors.pine} />
      </View>
    );
  }
  return <Navigation />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.paper },
  wordmark: { ...type.screenTitle, fontSize: 30, letterSpacing: -0.8 },
});
