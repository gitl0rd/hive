import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TermButton } from './Button';
import { Frame } from './Frame';
import { a, colors, fonts, glow } from './theme';

export type ConnectResult = { ok: true } | { ok: false; reason: 'bad token' | 'offline' | string };

/** First run (or Replace token): paste a Todoist API token, or try Demo mode. */
export function TokenSetup({
  onConnect,
  onDemo,
  onCancel,
}: {
  onConnect: (token: string) => Promise<ConnectResult>;
  onDemo?: () => void;
  onCancel?: () => void;
}) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    const t = token.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    const r = await onConnect(t);
    setBusy(false);
    if (!r.ok) {
      setError(
        r.reason === 'bad token'
          ? '> TOKEN REJECTED. CHECK IT AND TRY AGAIN.'
          : r.reason === 'offline'
            ? "> CAN'T REACH TODOIST. CHECK YOUR CONNECTION."
            : `> CONNECT FAILED (${r.reason.toUpperCase()}).`,
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.col}>
        <Text style={styles.brand}>
          HIVE·OS <Text style={{ opacity: 0.55 }}>{'// SETUP'}</Text>
        </Text>
        <Frame title="TODOIST.LINK" style={styles.win}>
          <Text style={styles.label} nativeID="token-label">
            {'> TODOIST TOKEN:'}
          </Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            onSubmitEditing={connect}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            placeholder="paste API token"
            placeholderTextColor={a(0.4)}
            accessibilityLabel="Todoist API token"
            accessibilityLabelledBy="token-label"
            style={styles.input}
            editable={!busy}
            testID="token-input"
          />
          <TermButton
            label={busy ? '[ CHECKING … ]' : '[ CONNECT ]'}
            onPress={connect}
            disabled={busy || !token.trim()}
            height={52}
            fontSize={26}
            glowBox
            accessibilityLabel="Connect Todoist"
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Text style={styles.note}>
            FIND IT IN TODOIST → SETTINGS → INTEGRATIONS → DEVELOPER → API TOKEN.
          </Text>
          <Text style={styles.note}>
            READ-ONLY: HIVE NEVER CHANGES ANYTHING IN TODOIST. THE TOKEN STAYS ON THIS DEVICE.
          </Text>
        </Frame>
        {onDemo ? (
          <TermButton
            label="[ DEMO MODE ]"
            onPress={onDemo}
            height={48}
            fontSize={24}
            accessibilityLabel="Try Demo mode with sample tasks"
          />
        ) : null}
        {onCancel ? (
          <TermButton label="[ CANCEL ]" onPress={onCancel} height={48} fontSize={24} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  col: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 22 },
  brand: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 3,
    color: colors.screen,
    ...glow,
  },
  win: { paddingTop: 26, paddingHorizontal: 16, paddingBottom: 18, gap: 14 },
  label: { fontFamily: fonts.display, fontSize: 24, color: colors.screen, ...glow },
  input: {
    height: 44,
    borderBottomWidth: 2,
    borderBottomColor: a(0.5),
    color: colors.screen,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  error: { fontFamily: fonts.display, fontSize: 20, color: colors.screen, ...glow },
  note: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 1,
    color: colors.screen,
    opacity: 0.7,
    ...glow,
  },
});
