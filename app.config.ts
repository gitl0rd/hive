import type { ConfigContext, ExpoConfig } from 'expo/config';

// GitHub Pages serves the site from /<repo>/. The deploy workflow sets EXPO_BASE_URL=/hive;
// local dev and native builds leave it unset.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
