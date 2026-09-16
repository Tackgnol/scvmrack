import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

// Shared editing behavior for integer text fields (HP, silver, ability
// scores). Backs the field with a local string draft instead of committing
// straight from the DOM value, which fixes three related bugs at once:
//   - an emptied field stays empty and neutral instead of committing 0
//     (RPG-63) — critical for HP, where a stray 0 arms the death confirm.
//   - non-digit characters (e/E/+/-/.) are filtered before they ever reach
//     the buffer or a commit, instead of relying on type="number" silently
//     blanking the DOM value on invalid intermediate input (RPG-61).
//   - leading zeroes ("007") stay as typed while editing, then normalize on
//     blur/Enter once the draft clears and display re-derives from the
//     already-committed integer (RPG-62).
export function useIntegerFieldBuffer(
  committedValue: number,
  onCommit: (digits: string) => void,
) {
  const [draft, setDraft] = useState<string | null>(null);

  const value = draft ?? String(committedValue);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    // React bails out of re-syncing the DOM when the controlled value string
    // is unchanged (e.g. typing "e" after "15" filters back to "15"), so the
    // browser would otherwise keep showing the rejected character. Correct
    // the DOM node directly so the display matches the filtered draft.
    event.target.value = digits;
    const previous = draft ?? String(committedValue);
    setDraft(digits);
    // A rejected character (e.g. "e") filters back to the same digits as
    // before — nothing was actually edited, so don't re-commit.
    if (digits === '' || digits === previous) return;
    onCommit(digits);
  };

  const onBlur = () => setDraft(null);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
  };

  return { value, onChange, onBlur, onKeyDown };
}
