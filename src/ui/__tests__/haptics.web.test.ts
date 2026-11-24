/* eslint-disable @typescript-eslint/no-require-imports -- each test re-imports the module fresh */
// Minimal DOM fakes: the React Native jest preset can't run under jsdom.
type FakeEl = {
  tag: string;
  attrs: Record<string, string>;
  style: Record<string, string>;
  children: FakeEl[];
  isConnected: boolean;
  type?: string;
  tabIndex?: number;
  clicks: number;
  setAttribute: (k: string, v: string) => void;
  appendChild: (c: FakeEl) => void;
  click: () => void;
};

function makeEl(tag: string): FakeEl {
  const el: FakeEl = {
    tag,
    attrs: {},
    style: {},
    children: [],
    isConnected: false,
    clicks: 0,
    setAttribute: (k, v) => {
      el.attrs[k] = v;
    },
    appendChild: (c) => {
      el.children.push(c);
      c.isConnected = el.isConnected;
    },
    click: () => {
      el.clicks++;
    },
  };
  return el;
}

const g = globalThis as unknown as { document?: unknown; navigator: { vibrate?: unknown } };
let body: FakeEl;

beforeEach(() => {
  jest.resetModules();
  body = makeEl('body');
  body.isConnected = true;
  g.document = { body, createElement: makeEl };
  delete g.navigator.vibrate;
});

afterAll(() => {
  delete g.document;
});

describe('web haptics', () => {
  it('uses the Vibration API where there is one', () => {
    const vibrate = jest.fn();
    g.navigator.vibrate = vibrate;
    const { haptic } = require('../haptics.web') as typeof import('../haptics.web');
    haptic('tap');
    haptic('heavy');
    expect(vibrate).toHaveBeenNthCalledWith(1, 8);
    expect(vibrate).toHaveBeenNthCalledWith(2, [30, 40, 30]);
    expect(body.children).toHaveLength(0);
  });

  it('otherwise (iOS Safari) clicks the label of one hidden native switch', () => {
    const { haptic } = require('../haptics.web') as typeof import('../haptics.web');
    haptic('tap');
    haptic('medium');
    expect(body.children).toHaveLength(1);
    const label = body.children[0];
    expect(label.tag).toBe('label');
    expect(label.attrs['aria-hidden']).toBe('true');
    expect(label.style.display).toBe('none');
    const input = label.children[0];
    expect(input.type).toBe('checkbox');
    expect(input.attrs.switch).toBe('');
    expect(label.clicks).toBe(2);
  });

  it('never throws without a DOM', () => {
    delete g.document;
    const { haptic } = require('../haptics.web') as typeof import('../haptics.web');
    expect(() => haptic('heavy')).not.toThrow();
  });
});
