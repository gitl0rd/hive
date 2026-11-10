import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pad2 } from '../domain/labels';
import { TermButton } from './Button';
import { Comb } from './Comb';
import { FlightLog } from './FlightLog';
import { Footer } from './Footer';
import { Frame } from './Frame';
import { History } from './History';
import { BracketTabs } from './Tabs';
import { TodayList } from './TodayList';
import { colors, fonts, glow, sizes } from './theme';
import type { BoardModel } from './useSampleBoard';

type Tab = 'spin' | 'today' | 'log';
const TABS = [
  { id: 'spin' as const, label: 'SPIN' },
  { id: 'today' as const, label: 'TODAY' },
  { id: 'log' as const, label: 'LOG' },
];

/** K wrist unit + flight log (390×844 reference). */
export function MobileLayout({ board }: { board: BoardModel }) {
  const [tab, setTab] = useState<Tab>('spin');
  const size = sizes.mobile;

  return (
    <View style={styles.root}>
      <BracketTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'spin' ? (
        <>
          <View style={styles.stats}>
            <Text style={styles.stat}>FLWR {pad2(board.counts.flowers)}</Text>
            <Text style={styles.stat}>LATE {pad2(board.counts.late)}</Text>
          </View>
          <View style={styles.comb}>
            <Comb flowers={board.flowers} excluded={board.excluded} seed={board.seed} size={size} />
          </View>
          <Frame title="FLIGHT.LOG" style={styles.log}>
            <FlightLog lines={board.log} />
          </Frame>
          <TermButton label="▶ SPIN" glowBox height={58} fontSize={30} style={styles.spin} />
        </>
      ) : tab === 'today' ? (
        <View style={styles.panel}>
          <TodayList flowers={board.flowers} excluded={board.excluded} onToggle={board.toggle} />
        </View>
      ) : (
        <View style={styles.panel}>
          <History landings={board.history} />
        </View>
      )}

      <Footer label="HIVE·OS" flowers={board.flowers} included={board.included} done={board.done} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 26, gap: 10 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  stat: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.screen,
    opacity: 0.75,
    ...glow,
  },
  comb: { flex: 1, minHeight: 200 },
  log: { height: 206, marginTop: 8 },
  spin: { marginHorizontal: 18, marginTop: 14, marginBottom: 6 },
  panel: { flex: 1, paddingTop: 10, minHeight: 0 },
});
