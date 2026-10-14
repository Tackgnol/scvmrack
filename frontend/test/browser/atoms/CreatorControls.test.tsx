import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { DiePicker } from '@/components/atoms/DiePicker/DiePicker';
import { NumberStepper } from '@/components/atoms/NumberStepper/NumberStepper';
import { SegmentedChoice } from '@/components/atoms/SegmentedChoice/SegmentedChoice';

describe('NumberStepper', () => {
  it('commits typed text on blur, clamped, and accepts a true minus', async () => {
    const onChange = vi.fn();
    render(
      <BrowserTestProvider>
        <NumberStepper id="mod" label="Modifier" value={0} min={-6} max={6} signedValue onChange={onChange} />
      </BrowserTestProvider>
    );
    const input = page.getByRole('spinbutton', { name: 'Modifier' });

    await input.fill('−2');
    await userEvent.keyboard('{Tab}');
    await input.fill('40');
    await userEvent.keyboard('{Enter}');

    expect(onChange.mock.calls).toEqual([[-2], [6]]);
  });

  it('nudges with the arrow keys and stops at its bounds', async () => {
    const onChange = vi.fn();
    render(
      <BrowserTestProvider>
        <NumberStepper id="dice" label="Dice" value={6} min={1} max={6} onChange={onChange} />
      </BrowserTestProvider>
    );
    await userEvent.click(page.getByRole('spinbutton', { name: 'Dice' }));

    await userEvent.keyboard('{ArrowUp}{ArrowDown}');

    expect(onChange.mock.calls).toEqual([[5]]);
    await expect.element(page.getByRole('button', { name: 'Increase Dice' })).toBeDisabled();
  });
});

describe('DiePicker', () => {
  it('is a radio group that arrows through the dice', async () => {
    const onChange = vi.fn();
    render(
      <BrowserTestProvider>
        <DiePicker id="hp" label="HP die" value={6} options={[4, 6, 8]} onChange={onChange} />
      </BrowserTestProvider>
    );
    await userEvent.click(page.getByRole('radio', { name: 'd6' }));

    await userEvent.keyboard('{ArrowRight}');

    await expect.poll(() => onChange).toHaveBeenCalledWith(8);
    await expect.element(page.getByRole('radio', { name: 'd8' })).toHaveFocus();
  });
});

describe('SegmentedChoice', () => {
  it('disables an option with the reason a GM reads, unless it is the chosen one', async () => {
    render(
      <BrowserTestProvider>
        <SegmentedChoice
          id="rule"
          label="Rule"
          value="book"
          options={[
            { value: 'book', label: 'Book rules' },
            { value: 'specialist', label: 'Specialist', disabledReason: 'Add random abilities first.' },
          ]}
          onChange={() => {}}
        />
      </BrowserTestProvider>
    );

    const specialist = page.getByRole('radio', { name: 'Specialist' });
    await expect.element(specialist).toBeDisabled();
    await expect.element(specialist).toHaveAttribute('title', 'Add random abilities first.');
  });
});
