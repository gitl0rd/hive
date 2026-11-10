import { fireEvent, render, screen } from '@testing-library/react-native';

import { sampleHistory } from '../../demo/sampleData';
import { History } from '../History';

describe('History', () => {
  it('shows an empty state', async () => {
    await render(<History landings={[]} />);
    expect(screen.getByText('NO ENTRIES. SPIN TO BEGIN.')).toBeTruthy();
  });

  it('deletes the pressed entry', async () => {
    const onDelete = jest.fn();
    await render(<History landings={sampleHistory} onDelete={onDelete} />);
    expect(screen.getAllByText('DEL')).toHaveLength(sampleHistory.length);
    await fireEvent.press(screen.getByTestId('hist-del-1'));
    expect(onDelete).toHaveBeenCalledWith(sampleHistory[1]);
  });
});
