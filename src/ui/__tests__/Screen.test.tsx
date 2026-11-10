import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Settings } from '../../store/settings';
import { Screen } from '../Screen';

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});

const settings = (over: Partial<Settings> = {}): Settings => ({
  mode: 'demo',
  haptics: false,
  reducedMotion: false,
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
  await waitFor(() => expect(screen.getByText('FLWR 09')).toBeTruthy());
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
});
