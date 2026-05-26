import { fireEvent, render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import NotesSection from '@/components/molecules/character/NoteSection';
import UnitTestProvider from '../../../UnitTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

describe('NotesSection Unit', () => {
  const mockUpdateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: 'Existing note text.' },
      updateField: mockUpdateField,
    } as any);
  });

  it('shows the section title when showTitle is true', () => {
    render(
      <UnitTestProvider>
        <NotesSection showTitle={true} />
      </UnitTestProvider>
    );

    // en.json: notes.title = "Notes & Miseries"
    expect(screen.getByText('Notes & Miseries')).toBeVisible();
  });

  it('hides the section title when showTitle is false', () => {
    render(
      <UnitTestProvider>
        <NotesSection showTitle={false} />
      </UnitTestProvider>
    );

    expect(screen.queryByText('Notes & Miseries')).not.toBeInTheDocument();
  });

  it('displays existing notes value in the textarea', () => {
    render(
      <UnitTestProvider>
        <NotesSection />
      </UnitTestProvider>
    );

    const textarea = screen.getByTestId('notes-input');
    expect(textarea).toHaveValue('Existing note text.');
  });

  it('shows empty textarea when notes is null', () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: null },
      updateField: mockUpdateField,
    } as any);

    render(
      <UnitTestProvider>
        <NotesSection />
      </UnitTestProvider>
    );

    const textarea = screen.getByTestId('notes-input');
    expect(textarea).toHaveValue('');
  });

  it('calls updateField with the new value when typing', async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: '' },
      updateField: mockUpdateField,
    } as any);

    render(
      <UnitTestProvider>
        <NotesSection />
      </UnitTestProvider>
    );

    const textarea = screen.getByTestId('notes-input');
    fireEvent.change(textarea, { target: { value: 'Debt to the ferryman.' } });

    expect(mockUpdateField).toHaveBeenCalledWith('notes', 'Debt to the ferryman.');
  });

  it('keeps newline characters in notes', async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: '' },
      updateField: mockUpdateField,
    } as any);

    render(
      <UnitTestProvider>
        <NotesSection />
      </UnitTestProvider>
    );

    const textarea = screen.getByTestId('notes-input');
    fireEvent.change(textarea, { target: { value: 'First line\nSecond line' } });

    expect(mockUpdateField).toHaveBeenCalledWith('notes', 'First line\nSecond line');
  });
});
