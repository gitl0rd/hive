import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { TokenSetup } from '../TokenSetup';

describe('TokenSetup', () => {
  it('connects with the trimmed token', async () => {
    const onConnect = jest.fn(async () => ({ ok: true as const }));
    await render(<TokenSetup onConnect={onConnect} onDemo={jest.fn()} />);
    await fireEvent.changeText(screen.getByTestId('token-input'), '  abc123  ');
    await fireEvent.press(screen.getByLabelText('Connect Todoist'));
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith('abc123'));
  });

  it('explains a rejected token and an offline failure', async () => {
    const onConnect = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: 'bad token' })
      .mockResolvedValueOnce({ ok: false, reason: 'offline' });
    await render(<TokenSetup onConnect={onConnect} />);
    await fireEvent.changeText(screen.getByTestId('token-input'), 'nope');
    await fireEvent.press(screen.getByLabelText('Connect Todoist'));
    expect(await screen.findByText('> TOKEN REJECTED. CHECK IT AND TRY AGAIN.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Connect Todoist'));
    expect(await screen.findByText("> CAN'T REACH TODOIST. CHECK YOUR CONNECTION.")).toBeTruthy();
  });

  it('does nothing without a token; offers Demo mode', async () => {
    const onConnect = jest.fn();
    const onDemo = jest.fn();
    await render(<TokenSetup onConnect={onConnect} onDemo={onDemo} />);
    await fireEvent.press(screen.getByLabelText('Connect Todoist'));
    expect(onConnect).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Try Demo mode with sample tasks'));
    expect(onDemo).toHaveBeenCalled();
  });

  it('never shows the token in clear text', async () => {
    await render(<TokenSetup onConnect={jest.fn()} />);
    expect(screen.getByTestId('token-input').props.secureTextEntry).toBe(true);
  });
});
