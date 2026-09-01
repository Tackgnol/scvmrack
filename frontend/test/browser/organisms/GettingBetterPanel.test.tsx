import { useEffect, useMemo, useState } from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import type {
  ImprovementDraft,
  ImprovementPreview,
  ImprovementRerollSection,
} from '@/api/characterImprovement';
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
    scumSpecialties: { kind: 'notScum' },
    ...overrides,
  };
}

function preview(rolledDraft: ImprovementDraft): ImprovementPreview {
  return {
    id: 'improvement-1',
    characterId: 'char-1',
    sequence: rolledDraft.sequence,
    rolledDraft,
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
  section: keyof Pick<ImprovementDraft, 'hp' | 'debris' | 'abilities' | 'scumSpecialties'>,
) {
  return JSON.stringify(workingDraft?.[section]) !== JSON.stringify(rolledDraft[section]);
}

function PanelHarness({
  initialDraft = draft(),
  events = {},
  onDraftChange,
  staleConflict = false,
}: {
  initialDraft?: ImprovementDraft;
  events?: PanelEvents;
  onDraftChange?: (draft: ImprovementDraft | null) => void;
  staleConflict?: boolean;
}) {
  const rolledDraft = useMemo(() => initialDraft, [initialDraft]);
  const activePreview = useMemo(() => preview(rolledDraft), [rolledDraft]);
  const [workingDraft, setWorkingDraft] = useState<ImprovementDraft | null>(
    structuredClone(rolledDraft),
  );
  const dirtySections = {
    hp: sectionDirty(rolledDraft, workingDraft, 'hp'),
    debris: sectionDirty(rolledDraft, workingDraft, 'debris'),
    abilities: sectionDirty(rolledDraft, workingDraft, 'abilities'),
    scumSpecialties: sectionDirty(rolledDraft, workingDraft, 'scumSpecialties'),
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
    await expect.element(page.getByText('Scum specialty')).not.toBeInTheDocument();

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

  it('renders first Gutterborn Scum specialty improvement details', async () => {
    const scumDraft = draft({
      scumSpecialties: {
        kind: 'firstImprovement',
        existing: { key: 'class.gutterborn-scum.specialty.1', rollValue: 1 },
        added: {
          key: 'class.gutterborn-scum.specialty.2',
          rollValue: 2,
          roll: serverRoll(2, [2]),
        },
      },
    });

    await render(
      <BrowserTestProvider>
        <PanelHarness initialDraft={scumDraft} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('Scum specialty')).toBeVisible();
    await expect.element(page.getByText('class.gutterborn-scum.specialty.1')).toBeVisible();
    await expect.element(page.getByText('class.gutterborn-scum.specialty.2')).toBeVisible();
  });

  it('renders later Gutterborn Scum reroll mode details', async () => {
    const scumDraft = draft({
      scumSpecialties: {
        kind: 'laterImprovement',
        primary: { key: 'class.gutterborn-scum.specialty.3', rollValue: 3 },
        secondary: { key: 'class.gutterborn-scum.specialty.4', rollValue: 4 },
        rerollMode: 'none',
      },
    });

    await render(
      <BrowserTestProvider>
        <PanelHarness initialDraft={scumDraft} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('Scum specialty')).toBeVisible();
    await expect.element(page.getByText('class.gutterborn-scum.specialty.3')).toBeVisible();
    await expect.element(page.getByText('class.gutterborn-scum.specialty.4')).toBeVisible();
    await expect.element(page.getByText('Keep both')).toBeVisible();
  });
});
