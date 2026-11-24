import { isInstalledPhoneWebApp } from '../installedPhone.web';

const g = globalThis as unknown as {
  window?: { matchMedia?: (q: string) => { matches: boolean } };
  navigator: { standalone?: boolean };
};

function setup({
  standalone,
  displayStandalone = false,
  coarse = false,
}: {
  standalone?: boolean;
  displayStandalone?: boolean;
  coarse?: boolean;
}) {
  g.navigator.standalone = standalone;
  g.window = {
    matchMedia: (q) => ({
      matches:
        (q === '(display-mode: standalone)' && displayStandalone) ||
        (q === '(pointer: coarse)' && coarse),
    }),
  };
}

afterEach(() => {
  delete g.navigator.standalone;
  delete g.window;
});

describe('isInstalledPhoneWebApp', () => {
  it('iPhone home-screen app', () => {
    setup({ standalone: true });
    expect(isInstalledPhoneWebApp()).toBe(true);
  });

  it('installed Android PWA (standalone + touch)', () => {
    setup({ displayStandalone: true, coarse: true });
    expect(isInstalledPhoneWebApp()).toBe(true);
  });

  it('installed desktop PWA keeps the bezel', () => {
    setup({ displayStandalone: true, coarse: false });
    expect(isInstalledPhoneWebApp()).toBe(false);
  });

  it('a phone browser tab keeps the bezel', () => {
    setup({ standalone: false, coarse: true });
    expect(isInstalledPhoneWebApp()).toBe(false);
  });

  it('no window: false', () => {
    expect(isInstalledPhoneWebApp()).toBe(false);
  });
});
