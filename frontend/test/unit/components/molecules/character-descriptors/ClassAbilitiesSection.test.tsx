import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import ClassAbilitiesSection from '@/components/molecules/character-descriptors/ClassAbilitiesSection';
import UnitTestProvider from '../../../UnitTestProvider';

describe('ClassAbilitiesSection Unit', () => {
  const abilities = [
    { name: 'Ability 1', description: 'Desc 1', comment: '' },
    { name: 'Ability 2', description: 'Desc 2', comment: 'Comp' },
  ];

  it('renders all abilities', () => {
    render(
      <UnitTestProvider>
        <ClassAbilitiesSection 
          abilities={abilities} 
          isOccultHerbmaster={false} 
          onUpdateComment={vi.fn()} 
        />
      </UnitTestProvider>
    );

    expect(screen.getByText('Ability 1')).toBeVisible();
    expect(screen.getByText('Ability 2')).toBeVisible();

  });

  it('renders empty message when no abilities', () => {
    render(
      <UnitTestProvider>
        <ClassAbilitiesSection 
          abilities={[]} 
          isOccultHerbmaster={false} 
          onUpdateComment={vi.fn()} 
        />
      </UnitTestProvider>
    );

    // In en.json character.noSpecialAbilities
    expect(screen.getByText(/no special abilities/i)).toBeVisible();

  });
});
