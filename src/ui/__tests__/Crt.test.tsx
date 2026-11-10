import { render, screen } from '@testing-library/react-native';

import { Crt } from '../Crt';
import { sizes } from '../theme';

describe('Crt', () => {
  it('renders an overlay that never takes touches', async () => {
    await render(<Crt size={sizes.mobile} />);
    expect(screen.getByTestId('crt-overlay').props.pointerEvents).toBe('none');
  });
});
