import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import { CoinPanel, sideText } from '../CoinFlip';
import { useCoin } from '../useCoin';

beforeEach(async () => {
  await AsyncStorage.clear();
});

function Harness({ reducedMotion = true }: { reducedMotion?: boolean }) {
  const coin = useCoin({ reducedMotion, haptics: false });
  return <CoinPanel coin={coin} />;
}

describe('sideText', () => {
  it('side name, plus the label when one is set', () => {
    expect(sideText('heads', '')).toBe('HEADS');
    expect(sideText('tails', '  gym ')).toBe('TAILS · GYM');
  });
});

describe('CoinPanel', () => {
  it('flips and shows the result and tally', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9); // tails
    await render(<Harness />);
    expect(screen.getByText('> READY')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Flip coin'));
    expect(screen.getByText('> TAILS')).toBeTruthy();
    expect(screen.getByText(/H 00 · T 01/)).toBeTruthy();
    expect(screen.getByLabelText('Coin showing TAILS. Tap to flip.')).toBeTruthy();
    jest.restoreAllMocks();
  });

  it('labels each side, shows them on the result, and remembers them', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1); // heads
    await render(<Harness />);
    await fireEvent.changeText(screen.getByTestId('coin-heads-input'), 'gym');
    await fireEvent.changeText(screen.getByTestId('coin-tails-input'), 'write');
    await fireEvent.press(screen.getByTestId('coin-stage'));
    expect(screen.getByText('> HEADS · GYM')).toBeTruthy();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('hive.coin')) ?? '{}')).toEqual({
        heads: 'gym',
        tails: 'write',
      }),
    );
    await fireEvent.press(screen.getByLabelText('Clear coin labels'));
    expect(screen.getByTestId('coin-heads-input').props.value).toBe('');
    jest.restoreAllMocks();
  });

  it('loads saved labels', async () => {
    await AsyncStorage.setItem('hive.coin', JSON.stringify({ heads: 'pasta', tails: 'tacos' }));
    await render(<Harness />);
    await waitFor(() => expect(screen.getByTestId('coin-tails-input').props.value).toBe('tacos'));
  });
});

describe('useCoin animation', () => {
  it('is in the air until the flip finishes, then lands on the planned side', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const { result } = await renderHook(() => useCoin({ haptics: false }));
    await act(async () => result.current.flip());
    expect(result.current.flipping).toBe(true);
    expect(result.current.result).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    expect(result.current.flipping).toBe(false);
    expect(result.current.result).toBe('tails');
    expect(result.current.pose).toMatchObject({ face: 'tails', squash: 1, lift: 0 });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
});
