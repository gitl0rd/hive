import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { pad2 } from '../domain/labels';
import { ActionRow } from './ActionRow';
import { CombButton } from './CombButton';
import { TermButton } from './Button';
import { Comb } from './Comb';
import { FlightLog, winnerHeader } from './FlightLog';
import { Footer } from './Footer';
import { Frame } from './Frame';
import { History } from './History';
import { FrameTabs } from './Tabs';
import { TodayList } from './TodayList';
import { colors, fonts, glow, layout, sizes } from './theme';
import type { Chrome } from './MobileLayout';
import type { BoardModel } from './useBoard';

type Tab = 'today' | 'history';

/** K desktop (≥ 900px). Below ~1000px the right column wraps under the comb. */
export function DesktopLayout({ board, chrome }: { board: BoardModel; chrome: Chrome }) {
  const [tab, setTab] = useState<Tab>('today');
  const { width, height } = useWindowDimensions();
  const wrapped = width < layout.desktopWrapWidth;
  const size = sizes.desktop;
  const { spin, winner, actions } = board;
  const flying = spin.phase === 'flying';
  const nothingToSpin = board.counts.flowers === 0;
  const spinLabel = flying ? '◌ IN FLIGHT …' : nothingToSpin ? 'NOTHING TO SPIN' : '▶ SPIN';
  const phaseTag = flying ? '◌ IN FLIGHT' : winner ? '■ LANDED' : '● READY';
  const tabs = [
    { id: 'today' as const, label: `TODAY · ${pad2(board.counts.flowers)}` },
    { id: 'history' as const, label: 'HISTORY' },
  ];

  // Side by side: fill the window exactly (definite height, so lists scroll inside their windows).
  // Wrapped (< 1000px): stack and let the page scroll.
  const logHeight = wrapped ? 290 : Math.max(180, Math.min(290, Math.round(height * 0.32)));

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.brand}>
          HIVE·OS <Text style={{ opacity: 0.55 }}>{'// DAILY SPIN'}</Text>
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.statLine}>
            {[
              `FLWR ${pad2(board.counts.flowers)}`,
              `LATE ${pad2(board.counts.late)}`,
              `DONE ${pad2(board.done)}`,
            ].join('\u00A0\u00A0\u00A0')}
          </Text>
        </View>
      </View>

      <View style={[styles.main, wrapped ? styles.mainWrapped : null]}>
        <Frame
          title="COMB.SYS"
          right={phaseTag}
          bottomRight={
            board.flowers.length > 0 ? (
              <CombButton
                phase={spin.phase}
                onShuffle={actions.shuffle}
                onReset={actions.reset}
                fontSize={22}
              />
            ) : undefined
          }
          tagSize={22}
          style={[styles.combWin, wrapped ? styles.combWinWrapped : null]}
          accessibilityLabel="Comb"
        >
          <View style={styles.combArea}>
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
          </View>
          {winner ? (
            <View style={styles.spin}>
              <ActionRow
                source={winner.source}
                title={winner.title}
                onOpen={actions.open}
                onDone={actions.done}
                onRemove={actions.remove}
                onAgain={actions.spin}
                height={60}
                fontSize={30}
              />
            </View>
          ) : (
            <TermButton
              label={spinLabel}
              glowBox={!flying && !nothingToSpin}
              disabled={flying || nothingToSpin}
              onPress={actions.spin}
              height={60}
              fontSize={30}
              style={styles.spin}
              accessibilityLabel={
                flying ? 'Bee in flight' : nothingToSpin ? 'Nothing to spin' : 'Spin'
              }
            />
          )}
        </Frame>

        <View style={[styles.right, wrapped ? styles.rightWrapped : null]}>
          <Frame
            title={<FrameTabs tabs={tabs} active={tab} onChange={setTab} />}
            style={[styles.listWin, wrapped ? styles.listWinWrapped : null]}
          >
            {tab === 'today' ? (
              <TodayList
                flowers={board.flowers}
                excluded={board.excluded}
                onToggle={actions.toggle}
                onAdd={actions.add}
                onDelete={actions.del}
                onSync={actions.sync}
                fontSize={24}
                highlightId={winner?.id}
                locked={board.locked}
              />
            ) : (
              <History landings={board.history} fontSize={24} onDelete={actions.deleteLanding} />
            )}
          </Frame>
          <Frame title="FLIGHT.LOG" tagSize={22} style={{ height: logHeight }}>
            <FlightLog
              lines={board.log}
              fontSize={14}
              showCursor={!flying}
              header={winner ? winnerHeader(winner, 52, 24) : undefined}
            />
          </Frame>
        </View>
      </View>

      <Footer
        label={chrome.demo ? 'HIVE·OS v2 · DEMO' : 'HIVE·OS v2'}
        onSettings={chrome.onSettings}
        flowers={board.flowers}
        included={board.included}
        done={board.done}
        fontSize={22}
        block={{ w: 10, h: 18, gap: 4, border: 2 }}
      />
    </>
  );

  return wrapped ? (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.root}>
      {content}
    </ScrollView>
  ) : (
    <View style={[styles.scroll, styles.root]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  root: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 28, gap: 26 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 2,
    borderBottomColor: colors.screen,
    paddingBottom: 10,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 3,
    color: colors.screen,
    ...glow,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  statLine: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: 2.6,
    color: colors.screen,
    ...glow,
  },
  main: { flex: 1, flexDirection: 'row', gap: 28, minHeight: 0 },
  mainWrapped: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', flexDirection: 'column' },
  combWin: {
    flex: 1.6,
    minWidth: 0,
    paddingTop: 36,
    paddingHorizontal: 28,
    paddingBottom: 28,
    gap: 24,
    alignItems: 'center',
  },
  combWinWrapped: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height: 640 },
  combArea: { flex: 1, alignSelf: 'stretch' },
  spin: { width: '100%', maxWidth: 560 },
  right: { flex: 1, minWidth: 360, gap: 28 },
  rightWrapped: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: 0 },
  listWin: { flex: 1, minHeight: 0, paddingTop: 30, paddingHorizontal: 16, paddingBottom: 16 },
  listWinWrapped: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height: 560 },
});
