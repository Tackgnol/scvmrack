import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import ModifierAdvancedModal from '@/components/molecules/modifiers/ModifierAdvancedModal';
import UnitTestProvider from '../../UnitTestProvider';

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
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByRole('heading', { name: /Add Modifier/i })).toBeTruthy();
    expect((screen.getByTestId('modal-mod-name-input') as HTMLInputElement).value).toBe(
      'New Modifier'
    );
    expect((screen.getByLabelText(/Value/i) as HTMLInputElement).value).toBe('1');
    expect(screen.getByDisplayValue('Testing')).toBeTruthy();
  });

  it('shows edit title and button label when isEditing is true', async () => {
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal {...defaultProps} isEditing={true} />
      </UnitTestProvider>
    );

    expect(screen.getByText(/Edit Modifier/i)).toBeTruthy();
    expect(screen.getByText(/Save/i)).toBeTruthy();
  });

  it('disables save button when canSave is false', async () => {
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal {...defaultProps} canSave={false} />
      </UnitTestProvider>
    );

    const saveButton = screen.getByTestId('modal-mod-save-btn') as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('calls change handlers when inputs change', async () => {
    const onNameChange = vi.fn();
    const onValueChange = vi.fn();
    const onCommentChange = vi.fn();

    function InteractiveModal() {
      const [name, setName] = useState(defaultProps.name);
      const [valueStr, setValueStr] = useState(defaultProps.valueStr);
      const [comment, setComment] = useState(defaultProps.comment);

      return (
        <ModifierAdvancedModal
          {...defaultProps}
          name={name}
          valueStr={valueStr}
          comment={comment}
          onNameChange={(value) => {
            setName(value);
            onNameChange(value);
          }}
          onValueChange={(value) => {
            setValueStr(value);
            onValueChange(value);
          }}
          onCommentChange={(value) => {
            setComment(value);
            onCommentChange(value);
          }}
        />
      );
    }

    render(
      <UnitTestProvider>
        <InteractiveModal />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const nameInput = screen.getByTestId('modal-mod-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    await waitFor(() => expect(onNameChange).toHaveBeenCalledWith('Updated Name'));

    // Use placeholder/label regex and wait for presence before fill
    const valueInput = screen.getByLabelText(/Value/i);
    await user.clear(valueInput);
    await user.type(valueInput, '2');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('2'));

    const commentInput = screen.getByLabelText(/Comment/i);
    await user.clear(commentInput);
    await user.type(commentInput, 'New Comment');
    await waitFor(() => expect(onCommentChange).toHaveBeenCalledWith('New Comment'));
  });

  it('calls onToggleInclude when a checkbox is clicked', async () => {
    const onToggleInclude = vi.fn();
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal
          {...defaultProps}
          includes={['melee']}
          onToggleInclude={onToggleInclude}
        />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const meleeCheckbox = screen.getByLabelText(/Melee attacks/i);
    // It's already checked, clicking it should toggle it to false
    await user.click(meleeCheckbox);
    await waitFor(() => expect(onToggleInclude).toHaveBeenCalledWith('melee', false));

    const rangedCheckbox = screen.getByLabelText(/Ranged attacks/i);
    await user.click(rangedCheckbox);
    await waitFor(() => expect(onToggleInclude).toHaveBeenCalledWith('ranged', true));
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn();
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal {...defaultProps} onSave={onSave} />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const saveButton = screen.getByTestId('modal-mod-save-btn');
    await user.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <UnitTestProvider>
        <ModifierAdvancedModal {...defaultProps} onClose={onClose} />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const cancelButton = screen.getByText(/Cancel/i);
    await user.click(cancelButton);
    await waitFor(() => expect(onClose).toHaveBeenCalled());

  });
});
