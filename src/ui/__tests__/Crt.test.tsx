import { render, screen } from '@testing-library/react-native';

import { Crt } from '../Crt';

describe('Crt', () => {
  it('renders an overlay that never takes touches', async () => {
    await render(<Crt />);
    expect(screen.getByTestId('crt-overlay').props.pointerEvents).toBe('none');
  });
});
