import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppRoot } from './src/ui/AppRoot';
import { getTheme } from './src/themes';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ VT323_400Regular, ShareTechMono_400Regular });

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {/* Render once fonts are in (or failed — fall back to system fonts rather than a blank screen). */}
        {fontsLoaded || fontError ? <AppRoot /> : null}
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: getTheme('hive').palette.bg },
});
