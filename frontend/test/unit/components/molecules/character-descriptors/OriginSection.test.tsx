import { fireEvent, render, screen } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import OriginSection from '@/components/molecules/character-descriptors/OriginSection';
import UnitTestProvider from '../../../UnitTestProvider';

describe('OriginSection Unit', () => {
  it('renders origin text', () => {
    render(
      <UnitTestProvider>
        <OriginSection origin="From the valley." onChangeOrigin={vi.fn()} />
      </UnitTestProvider>
    );

    expect(screen.getByText('From the valley.')).toBeVisible();

  });

  it('triggers onChangeOrigin when text is changed', async () => {
    const onChangeOrigin = vi.fn();
    render(
      <UnitTestProvider>
        <OriginSection origin="" onChangeOrigin={onChangeOrigin} />
      </UnitTestProvider>
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New origin' } });

    expect(onChangeOrigin).toHaveBeenCalledWith('New origin');

  });
});
