import { render, screen } from '@testing-library/react-native';

import { Crt } from '../Crt';
import { sizes } from '../theme';

describe('Crt', () => {
  it('renders an overlay that never takes touches', async () => {
    await render(<Crt size={sizes.mobile} />);
    expect(screen.getByTestId('crt-overlay').props.pointerEvents).toBe('none');
    expect(screen.getByTestId('crt-bezel')).toBeTruthy();
  });

  it('can leave the bezel out (phone home-screen app: the phone edge is the bezel)', async () => {
    await render(<Crt size={sizes.mobile} bezel={false} />);
    expect(screen.getByTestId('crt-overlay')).toBeTruthy();
    expect(screen.queryByTestId('crt-bezel')).toBeNull();
  });
});
