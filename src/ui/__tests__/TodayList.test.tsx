import { fireEvent, render, screen } from '@testing-library/react-native';

import { sampleFlowers } from '../../demo/sampleData';
import { TodayList } from '../TodayList';

const setup = async (excluded: string[] = []) => {
  const handlers = {
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    onAdd: jest.fn(),
    onSync: jest.fn(),
  };
  await render(<TodayList flowers={sampleFlowers} excluded={new Set(excluded)} {...handlers} />);
  return handlers;
};

describe('TodayList', () => {
  it('renders a row per flower with its project code and late tag', async () => {
    await setup();
    expect(screen.getByText('POCKET GOBLIN')).toBeTruthy();
    expect(screen.getAllByText('!2D')).toHaveLength(3);
    expect(screen.getByText('MDG')).toBeTruthy();
  });

  it('shows [x] for included and [ ] for excluded, and toggles', async () => {
    const h = await setup(['todoist:2']);
    expect(screen.getAllByText('[ ]')).toHaveLength(1);
    await fireEvent.press(screen.getByTestId('toggle-todoist:1'));
    expect(h.onToggle).toHaveBeenCalledWith('todoist:1');
  });

  it('every row has DEL', async () => {
    const h = await setup();
    expect(screen.getAllByText('DEL')).toHaveLength(sampleFlowers.length);
    await fireEvent.press(screen.getByTestId('del-hive:4'));
    expect(h.onDelete).toHaveBeenCalledWith('hive:4');
    await fireEvent.press(screen.getByTestId('del-todoist:1'));
    expect(h.onDelete).toHaveBeenCalledWith('todoist:1');
  });

  it('adds a trimmed Hive task and ignores blanks', async () => {
    const h = await setup();
    const input = screen.getByTestId('add-input');
    await fireEvent.changeText(input, '   ');
    await fireEvent.press(screen.getByLabelText('Add task'));
    expect(h.onAdd).not.toHaveBeenCalled();
    await fireEvent.changeText(input, '  water plants ');
    await fireEvent(input, 'submitEditing');
    expect(h.onAdd).toHaveBeenCalledWith('water plants');
  });

  it('sync calls back', async () => {
    const h = await setup();
    await fireEvent.press(screen.getByLabelText('Sync Todoist'));
    expect(h.onSync).toHaveBeenCalled();
  });
});
