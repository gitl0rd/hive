import { standaloneHeight } from '../standaloneHeight';

// iPhone 15 Pro Max-ish: 430×932 screen, status bar 59
const phone = { screenWidth: 430, screenHeight: 932 };

describe('standaloneHeight', () => {
  it('home-screen app one status bar short: stretch to the full screen', () => {
    expect(
      standaloneHeight({ standalone: true, innerWidth: 430, innerHeight: 873, ...phone }),
    ).toBe(932);
  });

  it('already full height (bug fixed by iOS): leave it', () => {
    expect(
      standaloneHeight({ standalone: true, innerWidth: 430, innerHeight: 932, ...phone }),
    ).toBeNull();
  });

  it('browser tab (toolbars take space): leave it', () => {
    expect(
      standaloneHeight({ standalone: false, innerWidth: 430, innerHeight: 739, ...phone }),
    ).toBeNull();
  });

  it('landscape uses the short side', () => {
    expect(
      standaloneHeight({ standalone: true, innerWidth: 932, innerHeight: 410, ...phone }),
    ).toBe(430);
  });

  it('a big shortfall is something else: leave it', () => {
    expect(
      standaloneHeight({ standalone: true, innerWidth: 430, innerHeight: 700, ...phone }),
    ).toBeNull();
  });
});
