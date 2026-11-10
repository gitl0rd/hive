import { fireEvent, render, screen } from '@testing-library/react-native';

import { sampleFlowers } from '../../demo/sampleData';
import { layoutItems } from '../../domain/board';
import { layoutBoard } from '../../domain/hexLayout';
import { Comb } from '../Comb';
import { sizes } from '../theme';

describe('Comb', () => {
  it('renders the board and the bee once it has a size', async () => {
    await render(
      <Comb
        flowers={sampleFlowers}
        layout={layoutBoard(11, layoutItems(sampleFlowers))}
        excluded={new Set()}
        size={sizes.mobile}
      />,
    );
    await fireEvent(screen.getByTestId('comb'), 'layout', {
      nativeEvent: { layout: { width: 340, height: 330, x: 0, y: 0 } },
    });
    expect(screen.getByTestId('pixel-bee')).toBeTruthy();
  });

  it('renders nothing but the container for an empty board', async () => {
    await render(
      <Comb flowers={[]} layout={{ cells: [] }} excluded={new Set()} size={sizes.desktop} />,
    );
    expect(screen.getByTestId('comb')).toBeTruthy();
  });
});
