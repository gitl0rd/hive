import { StyleSheet, View } from 'react-native';

import type { Source } from '../domain/types';
import { TermButton } from './Button';

/** Landing actions. Todoist: OPEN · REMOVE · AGAIN. Hive: DONE · REMOVE · AGAIN. */
export function ActionRow({
  source,
  title,
  onOpen,
  onDone,
  onRemove,
  onAgain,
  height = 56,
  fontSize = 24,
}: {
  source: Source;
  title: string;
  onOpen?: () => void;
  onDone?: () => void;
  onRemove?: () => void;
  onAgain?: () => void;
  height?: number;
  fontSize?: number;
}) {
  return (
    <View style={styles.row}>
      {source === 'todoist' ? (
        <TermButton
          label="OPEN"
          filled
          onPress={onOpen}
          height={height}
          fontSize={fontSize}
          style={styles.cell}
          accessibilityLabel={`Open ${title} in Todoist`}
        />
      ) : (
        <TermButton
          label="DONE"
          filled
          onPress={onDone}
          height={height}
          fontSize={fontSize}
          style={styles.cell}
          accessibilityLabel={`Mark ${title} done`}
        />
      )}
      <TermButton
        label="REMOVE"
        onPress={onRemove}
        height={height}
        fontSize={fontSize}
        style={styles.cell}
        accessibilityLabel={`Remove ${title} from today's spin`}
      />
      <TermButton
        label="AGAIN"
        onPress={onAgain}
        height={height}
        fontSize={fontSize}
        style={styles.cell}
        accessibilityLabel="Spin again"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
});
