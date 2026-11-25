import { isPhoneWeb } from '../phoneWeb.web';

const g = globalThis as unknown as {
  window?: { matchMedia?: (q: string) => { matches: boolean } };
  navigator: { standalone?: boolean };
};

function setup({ standalone, coarse = false }: { standalone?: boolean; coarse?: boolean }) {
  g.navigator.standalone = standalone;
  g.window = { matchMedia: (q) => ({ matches: q === '(pointer: coarse)' && coarse }) };
}

afterEach(() => {
  delete g.navigator.standalone;
  delete g.window;
});

describe('isPhoneWeb', () => {
  it('phone browser tab (touch)', () => {
    setup({ coarse: true });
    expect(isPhoneWeb()).toBe(true);
  });

  it('iPhone home-screen app', () => {
    setup({ standalone: true });
    expect(isPhoneWeb()).toBe(true);
  });

  it('desktop browser keeps the bezel', () => {
    setup({ coarse: false });
    expect(isPhoneWeb()).toBe(false);
  });

  it('no window: false', () => {
    expect(isPhoneWeb()).toBe(false);
  });
});
