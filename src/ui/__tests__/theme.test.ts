import { colors, layout } from '../theme';

describe('theme', () => {
  it('matches the K design tokens', () => {
    expect(colors.bg).toBe('#0B0600');
    expect(colors.screen).toBe('#FFA526');
    expect(colors.hive).toBe(colors.screen);
    expect(layout.desktopMinWidth).toBe(900);
  });
});
