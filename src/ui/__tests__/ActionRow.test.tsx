import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActionRow } from '../ActionRow';

describe('ActionRow', () => {
  it('Todoist winner: OPEN · REMOVE · AGAIN, no DONE', async () => {
    const onOpen = jest.fn();
    await render(<ActionRow source="todoist" title="pocket goblin" onOpen={onOpen} />);
    expect(screen.getByText('OPEN')).toBeTruthy();
    expect(screen.queryByText('DONE')).toBeNull();
    expect(screen.getByText('REMOVE')).toBeTruthy();
    expect(screen.getByText('AGAIN')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Open pocket goblin in Todoist'));
    expect(onOpen).toHaveBeenCalled();
  });

  it('Hive winner: DONE · REMOVE · AGAIN, no OPEN', async () => {
    const onDone = jest.fn();
    const onRemove = jest.fn();
    const onAgain = jest.fn();
    await render(
      <ActionRow source="hive" title="Gym" onDone={onDone} onRemove={onRemove} onAgain={onAgain} />,
    );
    expect(screen.queryByText('OPEN')).toBeNull();
    await fireEvent.press(screen.getByText('DONE'));
    await fireEvent.press(screen.getByText('REMOVE'));
    await fireEvent.press(screen.getByText('AGAIN'));
    expect(onDone).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalled();
    expect(onAgain).toHaveBeenCalled();
  });
});
