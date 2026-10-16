import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { SkullSwitch } from '@/components/atoms/SkullSwitch/SkullSwitch';

describe('SkullSwitch', () => {
  it('is a labelled switch toggled by click, Space and Enter', async () => {
    const onChange = vi.fn();
    render(
      <BrowserTestProvider>
        <SkullSwitch checked={false} onChange={onChange} label="Fanged Deserter in the pool" />
      </BrowserTestProvider>
    );

    const toggle = page.getByRole('switch', { name: 'Fanged Deserter in the pool' });
    await expect.element(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => onChange.mock.calls).toEqual([[true], [true], [true]]);
  });

  it('plays the flip from the old state when checked changes, even on re-render', async () => {
    const screen = await render(
      <BrowserTestProvider>
        <SkullSwitch checked={false} onChange={() => {}} label="Classless" />
      </BrowserTestProvider>
    );
    const toggle = page.getByRole('switch', { name: 'Classless' });
    await expect.element(toggle).not.toHaveClass('flip-on');

    await screen.rerender(
      <BrowserTestProvider>
        <SkullSwitch checked onChange={() => {}} label="Classless" />
      </BrowserTestProvider>
    );
    await expect.element(toggle).toHaveClass('flip-on');
    await expect.element(toggle).toHaveAttribute('aria-checked', 'true');

    await screen.rerender(
      <BrowserTestProvider>
        <SkullSwitch checked={false} onChange={() => {}} label="Classless" />
      </BrowserTestProvider>
    );
    await expect.element(toggle).toHaveClass('flip-off');
  });

  it('does nothing while locked', async () => {
    const onChange = vi.fn();
    render(
      <BrowserTestProvider>
        <SkullSwitch checked onChange={onChange} label="Locked" locked />
      </BrowserTestProvider>
    );

    const toggle = page.getByRole('switch', { name: 'Locked' });
    await expect.element(toggle).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(toggle, { force: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});
