import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Crt, CrtBackdrop } from './Crt';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { colors, layout, sizes } from './theme';
import { useBoard } from './useBoard';

/** Picks the mobile or desktop layout by width, under the CRT overlay. */
export function Screen() {
  const { width } = useWindowDimensions();
  const desktop = width >= layout.desktopMinWidth;
  const board = useBoard();

  return (
    <View style={styles.root}>
      <CrtBackdrop />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {desktop ? <DesktopLayout board={board} /> : <MobileLayout board={board} />}
      </SafeAreaView>
      <Crt size={desktop ? sizes.desktop : sizes.mobile} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
});
