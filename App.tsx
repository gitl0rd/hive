import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { Crt } from './src/ui/Crt';
import { Screen } from './src/ui/Screen';
import { colors } from './src/ui/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ VT323_400Regular, ShareTechMono_400Regular });

  return (
    <View style={styles.root}>
      {/* Render once fonts are in (or failed — fall back to system fonts rather than a blank screen). */}
      {fontsLoaded || fontError ? <Screen /> : null}
      <Crt />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
