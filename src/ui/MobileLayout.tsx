import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pad2 } from '../domain/labels';
import { ActionRow } from './ActionRow';
import { CombButton } from './CombButton';
import { TermButton } from './Button';
import { Comb } from './Comb';
import { FlightLog, winnerHeader } from './FlightLog';
import { Footer } from './Footer';
import { Frame } from './Frame';
import { History } from './History';
import { BracketTabs } from './Tabs';
import { TodayList } from './TodayList';
import { colors, fonts, glow, sizes } from './theme';
import type { BoardModel } from './useBoard';

/** App-level bits the layouts show: Demo marker, CFG entry. */
export interface Chrome {
  demo: boolean;
  onSettings: () => void;
}

type Tab = 'spin' | 'today' | 'log';
const TABS = [
  { id: 'spin' as const, label: 'SPIN' },
  { id: 'today' as const, label: 'TODAY' },
  { id: 'log' as const, label: 'LOG' },
];

/** K wrist unit + flight log (390×844 reference). */
export function MobileLayout({ board, chrome }: { board: BoardModel; chrome: Chrome }) {
  const [tab, setTab] = useState<Tab>('spin');
  const size = sizes.mobile;
  const { spin, winner, actions } = board;
  const flying = spin.phase === 'flying';
  const nothingToSpin = board.counts.flowers === 0;
  const spinLabel = flying ? '◌ IN FLIGHT …' : nothingToSpin ? 'NOTHING TO SPIN' : '▶ SPIN';

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
            <Comb
              flowers={board.flowers}
              layout={board.layout}
              excluded={board.excluded}
              size={size}
              spin={spin}
              emptyMessage={
                board.ready && board.flowers.length === 0
                  ? 'NO FLOWERS. ADD ONE OR SYNC.'
                  : undefined
              }
            />
            {board.flowers.length > 0 ? (
              <View style={styles.cornerBtn}>
                <CombButton
                  phase={spin.phase}
                  onShuffle={actions.shuffle}
                  onReset={actions.reset}
                />
              </View>
            ) : null}
          </View>
          <Frame title="FLIGHT.LOG" style={styles.log}>
            <FlightLog
              lines={board.log}
              showCursor={!flying}
              header={winner ? winnerHeader(winner, 40, 20) : undefined}
            />
          </Frame>
          {winner ? (
            <View style={styles.actions}>
              <ActionRow
                source={winner.source}
                title={winner.title}
                onOpen={actions.open}
                onDone={actions.done}
                onRemove={actions.remove}
                onAgain={actions.spin}
              />
            </View>
          ) : (
            <TermButton
              label={spinLabel}
              glowBox={!flying && !nothingToSpin}
              disabled={flying || nothingToSpin}
              onPress={actions.spin}
              height={58}
              fontSize={30}
              style={styles.spin}
              accessibilityLabel={
                flying ? 'Bee in flight' : nothingToSpin ? 'Nothing to spin' : 'Spin'
              }
            />
          )}
        </>
      ) : tab === 'today' ? (
        <View style={styles.panel}>
          <TodayList
            flowers={board.flowers}
            excluded={board.excluded}
            onToggle={actions.toggle}
            onAdd={actions.add}
            onDelete={actions.del}
            onSync={actions.sync}
            highlightId={winner?.id}
            locked={board.locked}
          />
        </View>
      ) : (
        <View style={styles.panel}>
          <History landings={board.history} onDelete={actions.deleteLanding} />
        </View>
      )}

      <Footer
        label={chrome.demo ? 'HIVE·OS DEMO' : 'HIVE·OS'}
        flowers={board.flowers}
        included={board.included}
        done={board.done}
        onSettings={chrome.onSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 26, gap: 10 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  stat: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.screen,
    opacity: 0.75,
    ...glow,
  },
  comb: { flex: 1, minHeight: 200 },
  cornerBtn: { position: 'absolute', right: 0, bottom: 0 },
  log: { height: 206, marginTop: 8 },
  spin: { marginHorizontal: 18, marginTop: 14, marginBottom: 6 },
  actions: { marginTop: 14, marginBottom: 8 },
  panel: { flex: 1, paddingTop: 10, minHeight: 0 },
});
