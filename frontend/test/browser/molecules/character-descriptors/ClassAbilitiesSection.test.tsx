import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import ClassAbilitiesSection from '@/components/molecules/character-descriptors/ClassAbilitiesSection';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('ClassAbilitiesSection Browser', () => {
  const abilities = [
    { name: 'Ability 1', description: 'Desc 1', comment: '' },
    { name: 'Ability 2', description: 'Desc 2', comment: 'Comp' },
  ];

  it('renders all abilities', async () => {
    await render(
      <BrowserTestProvider>
        <ClassAbilitiesSection 
          abilities={abilities} 
          isOccultHerbmaster={false} 
          onUpdateComment={vi.fn()} 
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Ability 1')).toBeVisible();
    await expect.element(page.getByText('Ability 2')).toBeVisible();

  });

  it('renders empty message when no abilities', async () => {
    await render(
      <BrowserTestProvider>
        <ClassAbilitiesSection 
          abilities={[]} 
          isOccultHerbmaster={false} 
          onUpdateComment={vi.fn()} 
        />
      </BrowserTestProvider>
    );

    // In en.json character.noSpecialAbilities
    await expect.element(page.getByText(/no special abilities/i)).toBeVisible();

  });
});
