import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import NotesSection from '@/components/molecules/character/NoteSection';
import BrowserTestProvider from '../../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

describe('NotesSection Browser', () => {
  const mockUpdateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: 'Existing note text.' },
      updateField: mockUpdateField,
    } as any);
  });

  it('shows the section title when showTitle is true', async () => {
    await render(
      <BrowserTestProvider>
        <NotesSection showTitle={true} />
      </BrowserTestProvider>
    );

    // en.json: notes.title = "Notes & Miseries"
    await expect.element(page.getByText('Notes & Miseries')).toBeVisible();
  });

  it('hides the section title when showTitle is false', async () => {
    await render(
      <BrowserTestProvider>
        <NotesSection showTitle={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Notes & Miseries')).not.toBeInTheDocument();
  });

  it('displays existing notes value in the textarea', async () => {
    await render(
      <BrowserTestProvider>
        <NotesSection />
      </BrowserTestProvider>
    );

    const textarea = page.getByTestId('notes-input');
    await expect.element(textarea).toHaveValue('Existing note text.');
  });

  it('shows empty textarea when notes is null', async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: null },
      updateField: mockUpdateField,
    } as any);

    await render(
      <BrowserTestProvider>
        <NotesSection />
      </BrowserTestProvider>
    );

    const textarea = page.getByTestId('notes-input');
    await expect.element(textarea).toHaveValue('');
  });

  it('calls updateField with the new value when typing', async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { id: 'char-1', notes: '' },
      updateField: mockUpdateField,
    } as any);

    await render(
      <BrowserTestProvider>
        <NotesSection />
      </BrowserTestProvider>
    );

    const textarea = page.getByTestId('notes-input');
    await userEvent.fill(textarea, 'Debt to the ferryman.');

    await expect.poll(() => mockUpdateField).toHaveBeenCalledWith('notes', 'Debt to the ferryman.');
  });
});
