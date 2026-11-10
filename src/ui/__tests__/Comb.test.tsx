import { fireEvent, render, screen } from '@testing-library/react-native';

import { sampleFlowers } from '../../demo/sampleData';
import { layoutItems } from '../../domain/board';
import { layoutBoard } from '../../domain/hexLayout';
import { Comb, labelMetrics, MIN_LABEL_PX } from '../Comb';
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

  it('shows the empty message instead of a board', async () => {
    await render(
      <Comb
        flowers={[]}
        layout={{ cells: [] }}
        excluded={new Set()}
        size={sizes.mobile}
        emptyMessage="NO FLOWERS. ADD ONE OR SYNC."
      />,
    );
    expect(screen.getByText('NO FLOWERS. ADD ONE OR SYNC.')).toBeTruthy();
    expect(screen.getByTestId('comb').props.accessibilityLabel).toBe(
      "Comb with 0 flowers, 0 in today's spin.",
    );
  });

  it('renders nothing but the container for an empty board', async () => {
    await render(
      <Comb flowers={[]} layout={{ cells: [] }} excluded={new Set()} size={sizes.desktop} />,
    );
    expect(screen.getByTestId('comb')).toBeTruthy();
  });
});

describe('labelMetrics', () => {
  it('keeps design sizes when the board is full size', () => {
    expect(labelMetrics(sizes.mobile, 1)).toEqual({ label: 21, late: 16, maxLines: 3 });
  });

  it('keeps labels readable on a shrunken board, with fewer lines', () => {
    const m = labelMetrics(sizes.mobile, 0.3);
    // ~10px on screen (or capped by the cell width)
    expect(m.label * 0.3).toBeGreaterThanOrEqual(
      Math.min(MIN_LABEL_PX, (sizes.mobile.cellWidth / 4.2) * 0.3) - 1e-9,
    );
    expect(m.maxLines).toBeLessThan(3);
    expect(m.label).toBeLessThanOrEqual(sizes.mobile.cellWidth / 4.2);
  });
});
