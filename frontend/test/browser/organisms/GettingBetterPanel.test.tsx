import i18n, { loadLanguage } from '@/i18n';
import { useEffect, useMemo, useState } from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type {
  ImprovementDraft,
  ImprovementPreview,
  ImprovementRerollSection,
} from '@/api/characterImprovementTypes';
import { GettingBetterPanel } from '@/components/organisms/getting-better/GettingBetterPanel';
import type { GettingBetterPreviewController } from '@/hooks/useGettingBetterPreview';
import BrowserTestProvider from '../BrowserTestProvider';

function serverRoll(total: number, dice: number[]) {
  return {
    source: 'server' as const,
    dice,
    total,
  };
}

function abilityRoll(fromScore = 9) {
  return {
    roll: serverRoll(2, [2]),
    fromScore,
    fromModifier: 0,
    toModifier: 1,
    toScore: 13,
    outcome: 'increase' as const,
  };
}

function draft(overrides: Partial<ImprovementDraft> = {}): ImprovementDraft {
  return {
    sequence: 1,
    snapshot: {
      characterUpdatedAt: '2026-07-07T10:00:00.000Z',
      maxHp: 10,
      silver: 5,
      abilities: {
        strength: 9,
        agility: 9,
        presence: 9,
        toughness: 9,
      },
      abilityKeys: [],
      equipmentFingerprint: 'empty',
      snapshotHash: 'snapshot-hash',
    },
    hp: {
      check: serverRoll(12, [2, 2, 2, 2, 2, 2]),
      fromMaxHp: 10,
      succeeds: true,
      increase: serverRoll(4, [4]),
      toMaxHp: 14,
    },
    debris: {
      roll: serverRoll(1, [1]),
      kind: 'nothing',
    },
    abilities: {
      strength: abilityRoll(),
      agility: abilityRoll(),
      presence: abilityRoll(),
      toughness: abilityRoll(),
    },
    classAbility: { kind: 'none' },
    ...overrides,
  };
}

function preview(
  rolledDraft: ImprovementDraft,
  abilityNames: Record<string, string> = {},
  rulesNote: string | null = null,
  scrollNames: Record<string, string> = {},
): ImprovementPreview {
  return {
    id: 'improvement-1',
    characterId: 'char-1',
    sequence: rolledDraft.sequence,
    rolledDraft,
    abilityNames,
    rulesNote,
    scrollNames,
    snapshotHash: rolledDraft.snapshot.snapshotHash,
    createdAt: '2026-07-07T10:00:00.000Z',
    updatedAt: '2026-07-07T10:00:00.000Z',
  };
}

type PanelEvents = {
  rerollSection?: (section: ImprovementRerollSection) => void;
  apply?: () => void;
  close?: () => boolean;
};

function sectionDirty(
  rolledDraft: ImprovementDraft,
  workingDraft: ImprovementDraft | null,
  section: keyof Pick<ImprovementDraft, 'hp' | 'debris' | 'abilities' | 'classAbility'>,
) {
  return JSON.stringify(workingDraft?.[section]) !== JSON.stringify(rolledDraft[section]);
}

function PanelHarness({
  initialDraft = draft(),
  abilityNames = {},
  rulesNote = null,
  scrollNames = {},
  events = {},
  onDraftChange,
  staleConflict = false,
}: {
  initialDraft?: ImprovementDraft;
  abilityNames?: Record<string, string>;
  rulesNote?: string | null;
  scrollNames?: Record<string, string>;
  events?: PanelEvents;
  onDraftChange?: (draft: ImprovementDraft | null) => void;
  staleConflict?: boolean;
}) {
  const rolledDraft = useMemo(() => initialDraft, [initialDraft]);
  const activePreview = useMemo(
    () => preview(rolledDraft, abilityNames, rulesNote, scrollNames),
    [rolledDraft, abilityNames, rulesNote, scrollNames],
  );
  const [workingDraft, setWorkingDraft] = useState<ImprovementDraft | null>(
    structuredClone(rolledDraft),
  );
  const dirtySections = {
    hp: sectionDirty(rolledDraft, workingDraft, 'hp'),
    debris: sectionDirty(rolledDraft, workingDraft, 'debris'),
    abilities: sectionDirty(rolledDraft, workingDraft, 'abilities'),
    classAbility: sectionDirty(rolledDraft, workingDraft, 'classAbility'),
  };
  const isDirty = Object.values(dirtySections).some(Boolean);

  useEffect(() => {
    onDraftChange?.(workingDraft);
  }, [onDraftChange, workingDraft]);

  const controller: GettingBetterPreviewController = {
    isOpen: true,
    preview: activePreview,
    workingDraft,
    dirtySections,
    isDirty,
    staleConflict,
    isLoadingPreview: false,
    isRerolling: false,
    isApplying: false,
    open: vi.fn(),
    close: events.close ?? vi.fn(() => true),
    undoEdits: () => setWorkingDraft(structuredClone(rolledDraft)),
    rerollSection: events.rerollSection ?? vi.fn(),
    apply: events.apply ?? vi.fn(),
    setWorkingDraft,
  };

  return <GettingBetterPanel controller={controller} />;
}

describe('GettingBetterPanel Browser', () => {
  it('lets a table HP value be edited and undone without keeping stale dice', async () => {
    let latestDraft: ImprovementDraft | null = null;
    await render(
      <BrowserTestProvider>
        <PanelHarness onDraftChange={(nextDraft) => { latestDraft = nextDraft; }} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByTestId('getting-better-panel')).toBeVisible();
    await expect.element(page.getByTestId('class-ability-section')).not.toBeInTheDocument();
    await expect.element(page.getByTestId('getting-better-rules-note')).not.toBeInTheDocument();

    const hpCheck = page.getByRole('spinbutton', { name: '6d10 check' });
    await expect.element(hpCheck).toBeVisible();
    await expect.element(hpCheck).toHaveValue(12);

    await userEvent.fill(hpCheck, '9');
    await expect.element(hpCheck).toHaveValue(9);
    await expect.element(page.getByText('No change')).toBeVisible();
    await expect.poll(() => latestDraft?.hp.check).toEqual({ source: 'table', total: 9 });

    await userEvent.click(page.getByRole('button', { name: 'Undo edits' }));
    await expect.element(hpCheck).toHaveValue(12);
    await expect.element(page.getByText('+4 max')).toBeVisible();
    await expect.poll(() => latestDraft?.hp.check).toEqual(serverRoll(12, [2, 2, 2, 2, 2, 2]));
  });

  it('labels ability rolls with translated stat names', async () => {
    await render(
      <BrowserTestProvider>
        <PanelHarness />
      </BrowserTestProvider>,
    );

    for (const name of ['Strength', 'Agility', 'Presence', 'Toughness']) {
      await expect.element(page.getByRole('spinbutton', { name })).toBeVisible();
    }
  });

  it('labels ability rolls with Polish stat names (RPG-318)', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    try {
      await render(
        <BrowserTestProvider>
          <PanelHarness />
        </BrowserTestProvider>,
      );

      for (const name of ['Siła', 'Zwinność', 'Opanowanie', 'Wytrzymałość']) {
        await expect.element(page.getByRole('spinbutton', { name, exact: true })).toBeVisible();
      }
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  it('routes reroll all, close, and apply actions through the controller', async () => {
    const events = {
      rerollSection: vi.fn(),
      close: vi.fn(() => true),
      apply: vi.fn(),
    };

    await render(
      <BrowserTestProvider>
        <PanelHarness events={events} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByTestId('getting-better-panel')).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Reroll all' }));
    await expect.poll(() => events.rerollSection).toHaveBeenCalledWith('all');

    await userEvent.click(page.getByRole('button', { name: 'Close' }));
    await expect.poll(() => events.close).toHaveBeenCalledTimes(1);

    await userEvent.click(page.getByRole('button', { name: 'Apply getting better' }));
    await expect.poll(() => events.apply).toHaveBeenCalledTimes(1);
  });

  it('prompts a stale preview reroll from the current sheet', async () => {
    const rerollSection = vi.fn();

    await render(
      <BrowserTestProvider>
        <PanelHarness events={{ rerollSection }} staleConflict />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByText('This preview is stale. Reroll from the current sheet before applying.'))
      .toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Reroll from current sheet' }));
    await expect.poll(() => rerollSection).toHaveBeenCalledWith('all');
  });

  it('renders a backend-translated sacred scroll name', async () => {
    const sacredDraft = draft({
      debris: {
        roll: serverRoll(6, [6]),
        kind: 'sacredScroll',
        scroll: serverRoll(10, [10]),
        itemKey: 'scroll.sacred.10',
      },
    });

    await render(
      <BrowserTestProvider>
        <PanelHarness
          initialDraft={sacredDraft}
          scrollNames={{ 'scroll.sacred.10': 'Syntaksa enoicka' }}
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('Syntaksa enoicka')).toBeVisible();
    await expect.element(page.getByText('scroll.sacred.10')).not.toBeInTheDocument();
  });

  it('renders a first Specialist improvement', async () => {
    const scumDraft = draft({
      classAbility: {
        kind: 'firstSpecialty',
        existing: [{ key: 'abilities.gutterborn_scum.fingersmith', rollValue: 2 }],
        added: {
          key: 'abilities.gutterborn_scum.jab',
          rollValue: 1,
          roll: serverRoll(1, [1]),
        },
      },
    });

    const existing = 'Filthy Fingersmith: Your snaky little digits get into pockets and pick locks with a DR8 Agility test. You also begin with lockpicks!';
    const added = 'Coward’s Jab: When attacking by surprise test Agility DR10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3.';

    await page.viewport(390, 844);
    await render(
      <BrowserTestProvider>
        <PanelHarness
          initialDraft={scumDraft}
          abilityNames={{
            'abilities.gutterborn_scum.fingersmith': existing,
            'abilities.gutterborn_scum.jab': added,
          }}
        />
      </BrowserTestProvider>,
    );

    const panel = page.getByTestId('getting-better-panel');
    await expect.element(panel).toBeVisible();
    const existingText = page.getByText(existing);
    const addedText = page.getByText(added);
    await expect.element(existingText).toBeVisible();
    await expect.element(addedText).toBeVisible();
    const labelRange = document.createRange();
    labelRange.selectNodeContents(existingText.element().previousElementSibling!);
    const existingLabel = labelRange.getBoundingClientRect();
    const existingValue = existingText.element().getBoundingClientRect();
    labelRange.selectNodeContents(addedText.element().previousElementSibling!);
    const addedLabel = labelRange.getBoundingClientRect();
    const addedValue = addedText.element().getBoundingClientRect();
    expect(existingLabel.right <= existingValue.left || existingLabel.bottom <= existingValue.top).toBe(true);
    expect(addedLabel.right <= addedValue.left || addedLabel.bottom <= addedValue.top).toBe(true);
    expect(existingValue.bottom <= addedLabel.top).toBe(true);
  });

  it('toggles each specialty between keep and reroll, disabling reroll when nothing is free', async () => {
    let latestDraft: ImprovementDraft | null = null;
    const specialtiesDraft = draft({
      classAbility: {
        kind: 'specialties',
        specialties: [
          {
            current: { key: 'abilities.gutterborn_scum.fingersmith', rollValue: 2 },
            replacement: {
              key: 'abilities.gutterborn_scum.fate',
              rollValue: 4,
              roll: serverRoll(4, [4]),
            },
            reroll: false,
          },
          {
            current: { key: 'abilities.gutterborn_scum.gob_lobber', rollValue: 3 },
            replacement: null,
            reroll: false,
          },
        ],
      },
    });

    await render(
      <BrowserTestProvider>
        <PanelHarness
          initialDraft={specialtiesDraft}
          abilityNames={{
            'abilities.gutterborn_scum.fingersmith': 'Fingersmith',
            'abilities.gutterborn_scum.gob_lobber': 'Gob Lobber',
            'abilities.gutterborn_scum.fate': 'Escaping Fate',
          }}
          onDraftChange={(nextDraft) => { latestDraft = nextDraft; }}
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('Specialties')).toBeVisible();
    await expect.element(page.getByText('Reroll gives Escaping Fate')).toBeVisible();
    await expect.element(page.getByText('No ability left to gain')).toBeVisible();

    const fingersmith = page.getByRole('group', { name: 'Fingersmith' });
    const gobLobber = page.getByRole('group', { name: 'Gob Lobber' });
    await expect.element(gobLobber.getByRole('button', { name: 'Reroll' })).toBeDisabled();

    await userEvent.click(fingersmith.getByRole('button', { name: 'Reroll' }));
    await expect
      .poll(() =>
        latestDraft?.classAbility.kind === 'specialties'
          ? latestDraft.classAbility.specialties.map((choice) => choice.reroll)
          : null,
      )
      .toEqual([true, false]);
  });

  it('lets only one specialty take an offer two specialties share', async () => {
    const shared = {
      key: 'abilities.gutterborn_scum.fate',
      rollValue: 4,
      roll: serverRoll(4, [4]),
    };
    await render(
      <BrowserTestProvider>
        <PanelHarness
          initialDraft={draft({
            classAbility: {
              kind: 'specialties',
              specialties: [
                { current: { key: 'one', rollValue: 1 }, replacement: shared, reroll: false },
                { current: { key: 'two', rollValue: 2 }, replacement: shared, reroll: false },
              ],
            },
          })}
          abilityNames={{ one: 'One', two: 'Two' }}
        />
      </BrowserTestProvider>,
    );

    const one = page.getByRole('group', { name: 'One' });
    const two = page.getByRole('group', { name: 'Two' });
    await userEvent.click(one.getByRole('button', { name: 'Reroll' }));
    await expect.element(two.getByRole('button', { name: 'Reroll' })).toBeDisabled();

    await userEvent.click(one.getByRole('button', { name: 'Keep' }));
    await expect.element(two.getByRole('button', { name: 'Reroll' })).toBeEnabled();
  });

  it('shows the class rules note at the top', async () => {
    await render(
      <BrowserTestProvider>
        <PanelHarness rulesNote="Bones knit crooked here: roll twice, keep the worse." />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByTestId('getting-better-rules-note'))
      .toHaveTextContent('Bones knit crooked here: roll twice, keep the worse.');
  });
});
