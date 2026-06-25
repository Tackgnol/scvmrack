import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, describe, it, expect } from 'vitest';
import { WarbandCardView } from '@/components/organisms/party/WarbandCardView';
import type { WarbandMember } from '@/components/organisms/party/warbandMember';
import BrowserTestProvider from '../../BrowserTestProvider';
import i18n, { loadLanguage } from '@/i18n';

const member: WarbandMember = {
  id: 'vrax',
  name: 'Vrax',
  cls: 'Gutterborn Scum',
  dead: false,
  hpText: '11/13',
  hpPct: 85,
  agi: '+1',
  pre: '−2',
  str: '+2',
  tou: '+1',
  dodge: 12,
  melee: 13,
  ranged: 8,
  dr: 0,
  dodgeC: [{ label: 'Base test', labelKey: 'gm.baseTest', val: 'DR12' }],
  meleeC: [{ label: 'Base test', labelKey: 'gm.baseTest', val: 'DR12' }],
  rangedC: [{ label: 'Base test', labelKey: 'gm.baseTest', val: 'DR12' }],
  weapon: 'Rusty knife (d4)',
  armor: 'None',
  omenText: '2/2',
  silver: 6,
  modifiers: [],
  hasMods: false,
  modCount: 0,
  trait1: 'Lazy',
  trait2: 'Authority-denying',
  habit: 'Collects small sharp stones.',
  bodyDesc: 'Recently slashed.',
  origin: 'A burnt-black building in Sarkash.',
  equipment: [],
  equipCount: 0,
};

describe('WarbandCardView', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders identity, hp, and combat values', async () => {
    await render(
      <BrowserTestProvider>
        <WarbandCardView member={member} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('Vrax')).toBeVisible();
    await expect.element(page.getByText('Gutterborn Scum')).toBeVisible();
    await expect.element(page.getByText('11/13')).toBeVisible();
    await expect.element(page.getByText('Rusty knife (d4)')).toBeVisible();
  });

  it('shows a DEAD badge for a fallen scvm', async () => {
    await render(
      <BrowserTestProvider>
        <WarbandCardView
          member={{ ...member, name: 'Old Nan', dead: true, hpText: '0/9' }}
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('† DEAD')).toBeVisible();
  });

  it('opens detail tooltips from hover and click', async () => {
    await render(
      <BrowserTestProvider>
        <WarbandCardView member={member} />
      </BrowserTestProvider>,
    );

    await userEvent.hover(page.getByText('AGI'));
    await expect
      .element(page.getByText('Dodging, fleeing, initiative, and ranged aim.'))
      .toBeVisible();

    await userEvent.unhover(page.getByText('AGI'));
    await userEvent.click(page.getByText('PRE'));
    await expect
      .element(page.getByText('Perception, powers, and ranged attacks.'))
      .toBeVisible();
  });

  it('localizes combat contribution tooltips in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');

    await render(
      <BrowserTestProvider>
        <WarbandCardView member={member} />
      </BrowserTestProvider>,
    );

    await userEvent.hover(page.getByText('Obrona'));

    await expect.element(page.getByText('Test bazowy')).toBeVisible();
  });

  it('localizes computed modifier origin tooltips in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');

    await render(
      <BrowserTestProvider>
        <WarbandCardView
          member={{
            ...member,
            modifiers: [
              {
                label: 'Leather armor',
                value: '−2',
                statKey: 'attributes.agility',
                statFallback: 'AGILITY',
                effect: '−2 AGILITY',
                kind: 'debuff',
                edge: '#FF2FB2',
                descKey: 'modifiers.computed.originDescriptions.armor',
                desc: 'From equipped armor.',
              },
            ],
            hasMods: true,
            modCount: 1,
          }}
        />
      </BrowserTestProvider>,
    );

    await userEvent.hover(page.getByText('Leather armor'));

    await expect.element(page.getByText('Z założonego pancerza.')).toBeVisible();
  });
});
