const packageJson = require('./package.json');

module.exports = {
  expo: {
    name: 'FocusFlow',
    slug: 'focusflow',
    version: packageJson.version,
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      backgroundColor: '#0F2E2A',
      resizeMode: 'contain',
    },
    android: {
      package: 'edu.cisc594.focusflow',
      minSdkVersion: 26,
      adaptiveIcon: {
        backgroundColor: '#0F2E2A',
      },
      permissions: ['SCHEDULE_EXACT_ALARM', 'POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED'],
    },
    ios: {
      bundleIdentifier: 'edu.cisc594.focusflow',
      supportsTablet: false,
    },
    plugins: [
      [
        'expo-notifications',
        {
          color: '#0F6E63',
        },
      ],
    ],
  },
};
