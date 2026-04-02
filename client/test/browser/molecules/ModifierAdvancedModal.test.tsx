import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import ModifierAdvancedModal from '../../../src/components/molecules/modifiers/ModifierAdvancedModal';
import BrowserTestProvider from '../BrowserTestProvider';

describe('ModifierAdvancedModal', () => {
  const defaultProps = {
    open: true,
    isEditing: false,
    canSave: true,
    name: 'New Modifier',
    stat: 'agility' as const,
    valueStr: '1',
    scope: 'all' as const,
    includes: ['melee', 'ranged', 'defence', 'cast', 'ability'] as any[],
    comment: 'Testing',
    onClose: vi.fn(),
    onSave: vi.fn(),
    onNameChange: vi.fn(),
    onStatChange: vi.fn(),
    onValueChange: vi.fn(),
    onScopeChange: vi.fn(),
    onToggleInclude: vi.fn(),
    onCommentChange: vi.fn(),
  };

  it('renders correctly with title and fields', async () => {
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/Add Modifier/i)).toBeInTheDocument();
    await expect.element(page.getByTestId('modal-mod-name-input')).toHaveValue('New Modifier');
    await expect.element(page.getByLabelText(/Value/i)).toHaveValue(1);
    await expect.element(page.getByText(/Testing/i)).toBeInTheDocument(); // Comment field

  });

  it('shows edit title and button label when isEditing is true', async () => {
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal {...defaultProps} isEditing={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/Edit Modifier/i)).toBeInTheDocument();
    await expect.element(page.getByText(/Save/i)).toBeInTheDocument(); // Save button text

  });

  it('disables save button when canSave is false', async () => {
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal {...defaultProps} canSave={false} />
      </BrowserTestProvider>
    );

    const saveButton = page.getByTestId('modal-mod-save-btn');
    await expect.element(saveButton).toBeDisabled();

  });

  it('calls change handlers when inputs change', async () => {
    const onNameChange = vi.fn();
    const onValueChange = vi.fn();
    const onCommentChange = vi.fn();

    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal
          {...defaultProps}
          onNameChange={onNameChange}
          onValueChange={onValueChange}
          onCommentChange={onCommentChange}
        />
      </BrowserTestProvider>
    );

    const nameInput = page.getByTestId('modal-mod-name-input');
    await nameInput.fill('Updated Name');
    await expect.poll(() => onNameChange).toHaveBeenCalledWith('Updated Name');

    // Use placeholder/label regex and wait for presence before fill
    const valueInput = page.getByLabelText(/Value/i);
    await valueInput.fill('2');
    await expect.poll(() => onValueChange).toHaveBeenCalledWith('2');

    const commentInput = page.getByLabelText(/Comment/i);
    await commentInput.fill('New Comment');
    await expect.poll(() => onCommentChange).toHaveBeenCalledWith('New Comment');

  });

  it('calls onToggleInclude when a checkbox is clicked', async () => {
    const onToggleInclude = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal
          {...defaultProps}
          includes={['melee']}
          onToggleInclude={onToggleInclude}
        />
      </BrowserTestProvider>
    );

    const meleeCheckbox = page.getByLabelText(/Melee attacks/i);
    // It's already checked, clicking it should toggle it to false
    await meleeCheckbox.click();
    await expect.poll(() => onToggleInclude).toHaveBeenCalledWith('melee', false);

    const rangedCheckbox = page.getByLabelText(/Ranged attacks/i);
    await rangedCheckbox.click();
    await expect.poll(() => onToggleInclude).toHaveBeenCalledWith('ranged', true);

  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal {...defaultProps} onSave={onSave} />
      </BrowserTestProvider>
    );

    const saveButton = page.getByTestId('modal-mod-save-btn');
    await saveButton.click();
    await expect.poll(() => onSave).toHaveBeenCalled();

  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModifierAdvancedModal {...defaultProps} onClose={onClose} />
      </BrowserTestProvider>
    );

    const cancelButton = page.getByText(/Cancel/i);
    await cancelButton.click();
    await expect.poll(() => onClose).toHaveBeenCalled();

  });
});
