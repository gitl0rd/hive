import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Settings } from '../../store/settings';
import { Screen } from '../Screen';
import { ThemeProvider } from '../ThemeContext';

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const settings = (over: Partial<Settings> = {}): Settings => ({
  mode: 'demo',
  haptics: false,
  reducedMotion: false,
  theme: 'hive',
  ...over,
});

async function renderDemo(over: Partial<Settings> = {}) {
  await render(
    <Screen
      mode="demo"
      token={null}
      settings={settings(over)}
      onSettingsChange={jest.fn()}
      onReplaceToken={jest.fn()}
      onForgetToken={jest.fn()}
      onLeaveDemo={jest.fn()}
    />,
  );
  // demo seeds 4 Hive tasks + 5 sample Todoist tasks
  await waitFor(() => expect(screen.getByLabelText("9 of 9 flowers in today's spin")).toBeTruthy());
}

const INTERACTIVE = new Set(['button', 'checkbox', 'tab', 'image']);

/** Accessible name: explicit label, or the text inside. */
type Node = typeof screen.container;

function textOf(node: Node | string): string {
  if (typeof node === 'string') return node;
  return node.children.map((c) => textOf(c as Node | string)).join(' ');
}

function accessibleName(node: Node): string {
  if (node.props.accessibilityLabel) return String(node.props.accessibilityLabel);
  return textOf(node).trim();
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('Screen (Demo mode)', () => {
  it('every button, checkbox, tab and image has an accessible name', async () => {
    await renderDemo();
    const check = () => {
      const nodes = screen.container.queryAll((n) => INTERACTIVE.has(n.props.accessibilityRole));
      expect(nodes.length).toBeGreaterThanOrEqual(4);
      for (const n of nodes) {
        expect({ role: n.props.accessibilityRole, name: accessibleName(n) }).toEqual({
          role: n.props.accessibilityRole,
          name: expect.stringMatching(/\w/),
        });
      }
    };
    check(); // SPIN tab
    await fireEvent.press(screen.getByRole('tab', { name: 'TODAY' }));
    check();
    await fireEvent.press(screen.getByRole('tab', { name: 'LOG' }));
    check();
    await fireEvent.press(screen.getByLabelText('Settings'));
    check();
  });

  it('reduced motion lands straight away, without hop lines', async () => {
    await renderDemo({ reducedMotion: true });
    await fireEvent.press(screen.getByLabelText('Spin'));
    await waitFor(() => expect(screen.getByLabelText('Spin again')).toBeTruthy(), {
      timeout: 1000,
    });
    expect(screen.queryByText(/hop \d\d/)).toBeNull();
    expect(screen.getByText(/LANDED:/)).toBeTruthy();
    expect(screen.getByRole('image').props.accessibilityLabel).toMatch(/^Comb. The bee landed on/);
  });

  it('corner button: SHUFFLE when idle, RESET after landing (removes nothing)', async () => {
    await renderDemo({ reducedMotion: true });
    expect(screen.getByText('[SHUFFLE]')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Shuffle the board'));
    expect(screen.getByText(/shuffle comb \.\.\. ok/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Spin'));
    await waitFor(() => expect(screen.getByLabelText('Spin again')).toBeTruthy());
    expect(screen.getByText('[RESET]')).toBeTruthy();
    expect(screen.queryByText('[SHUFFLE]')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Reset the comb'));
    expect(screen.getByLabelText('Spin')).toBeTruthy();
    expect(screen.queryByLabelText('Spin again')).toBeNull();
    expect(screen.getByText('[SHUFFLE]')).toBeTruthy();
    expect(screen.getByLabelText("9 of 9 flowers in today's spin")).toBeTruthy(); // nothing excluded
    expect(screen.getByText(/reset comb \.\.\. bee home/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'LOG' }));
    expect(screen.getAllByText('DEL')).toHaveLength(1); // the landing stays in history
  });
});

describe('Screen themes', () => {
  it('settings switch the theme', async () => {
    const onSettingsChange = jest.fn();
    await render(
      <Screen
        mode="demo"
        token={null}
        settings={settings()}
        onSettingsChange={onSettingsChange}
        onReplaceToken={jest.fn()}
        onForgetToken={jest.fn()}
        onLeaveDemo={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByLabelText('Settings'));
    expect(screen.getByRole('radio', { name: 'HIVE theme' }).props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(screen.getByRole('radio', { name: 'BRAIN HIVE theme' }));
    expect(onSettingsChange).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'brain' }));
  });

  it('BRAIN HIVE re-words the board and the log', async () => {
    await render(
      <ThemeProvider id="brain">
        <Screen
          mode="demo"
          token={null}
          settings={settings({ theme: 'brain', reducedMotion: true })}
          onSettingsChange={jest.fn()}
          onReplaceToken={jest.fn()}
          onForgetToken={jest.fn()}
          onLeaveDemo={jest.fn()}
        />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("9 of 9 thoughts in today's spin")).toBeTruthy(),
    );
    expect(screen.getByText('BRAIN·HIVE DEMO')).toBeTruthy();
    expect(screen.getByText('SYNAPSE.LOG')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'THINK' })).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Think'));
    await waitFor(() => expect(screen.getByLabelText('Spin again')).toBeTruthy());
    expect(screen.getByText(/FOCUS:/)).toBeTruthy(); // log shows the newest line
    expect(screen.queryByText(/LANDED:/)).toBeNull();
  });
});
