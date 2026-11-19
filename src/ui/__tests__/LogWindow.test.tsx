import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { LogWindow } from '../LogWindow';

describe('LogWindow', () => {
  it('open: shows the log and a collapse control', async () => {
    const onToggle = jest.fn();
    await render(
      <LogWindow collapsed={false} onToggle={onToggle} lastLine="09:00 > ready.">
        <Text>full log</Text>
      </LogWindow>,
    );
    expect(screen.getByText('full log')).toBeTruthy();
    expect(screen.getByText('FLIGHT.LOG ▾')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Collapse flight log'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('collapsed: hides the log, keeps the newest line', async () => {
    await render(
      <LogWindow collapsed onToggle={jest.fn()} lastLine="09:01 > LANDED: GYM [HIVE]">
        <Text>full log</Text>
      </LogWindow>,
    );
    expect(screen.queryByText('full log')).toBeNull();
    expect(screen.getByText('09:01 > LANDED: GYM [HIVE]')).toBeTruthy();
    expect(screen.getByLabelText('Expand flight log').props.accessibilityState).toMatchObject({
      expanded: false,
    });
  });
});
