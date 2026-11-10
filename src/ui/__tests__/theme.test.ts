import { getThemeTokens } from '../../themes';
import { layout } from '../theme';

describe('theme', () => {
  it('matches the K design tokens by default', () => {
    const t = getThemeTokens('hive');
    expect(t.bg).toBe('#0B0600');
    expect(t.screen).toBe('#FFA526');
    expect(t.hive).toBe(t.screen);
    expect(layout.desktopMinWidth).toBe(900);
  });
});
