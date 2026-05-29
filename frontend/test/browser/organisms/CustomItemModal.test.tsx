import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import CustomItemModal from '@/components/organisms/CustomItemModal';
import type { ReactNode } from 'react';

const onClose = vi.fn();
const onCreate = vi.fn();

vi.mock('@components/index', () => ({
  MorkBorgModal: ({
    open,
    title,
    children,
    actions,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    actions?: ReactNode;
  }) =>
    open ? (
      <section role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div>{actions}</div>
      </section>
    ) : null,
}));

describe('CustomItemModal', () => {
  const renderModal = async () =>
    render(
      <BrowserTestProvider>
        <CustomItemModal
          open
          character={{
            agility: 8,
            strength: 10,
            presence: 14,
            toughness: 6,
          } as any}
          ammoTypes={['Arrow', 'Bolt']}
          onClose={onClose}
          onCreate={onCreate}
        />
      </BrowserTestProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a valid custom item bundle and closes the modal', async () => {
    await renderModal();

    const submit = page.getByRole('button', { name: /^forge$/i });
    await expect.element(submit).toBeDisabled();

    await userEvent.fill(
      page.getByRole('textbox', { name: /item name/i }),
      'Bone Charm'
    );
    await expect.element(submit).toBeEnabled();
    await userEvent.click(submit);

    await expect.poll(() => onCreate).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Bone Charm' }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('switches between item-kind specific panels', async () => {
    await renderModal();

    await userEvent.click(page.getByRole('radio', { name: /weapon/i }));
    await expect
      .element(page.getByRole('combobox', { name: /damage die/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('combobox', { name: /ammo type/i }))
      .toBeVisible();
    await userEvent.fill(
      page.getByRole('combobox', { name: /ammo type/i }),
      'Arrow'
    );
    await expect
      .element(page.getByRole('spinbutton', { name: /add ammo/i }))
      .toBeVisible();
    await userEvent.click(
      page.getByRole('checkbox', { name: /grants a modifier/i })
    );
    await expect
      .element(page.getByRole('combobox', { name: /applies to/i }))
      .toBeVisible();

    await userEvent.click(page.getByRole('radio', { name: /armor/i }));
    await expect
      .element(page.getByRole('combobox', { name: /armor tier/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('combobox', { name: /protection die/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('spinbutton', { name: /max tier/i }))
      .toBeVisible();

    await userEvent.click(page.getByRole('radio', { name: /consumable/i }));
    await expect
      .element(page.getByRole('combobox', { name: /use count/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('spinbutton', { name: /base uses/i }))
      .toBeVisible();

    await userEvent.click(page.getByRole('radio', { name: /^ammo$/i }));
    await expect
      .element(page.getByRole('combobox', { name: /ammo type/i }))
      .toBeVisible();
    await expect
      .element(page.getByRole('spinbutton', { name: /amount/i }))
      .toBeVisible();
  });
});
