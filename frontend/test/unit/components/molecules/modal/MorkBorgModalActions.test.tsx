import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Button } from '@mui/material';
import MorkBorgModalActions from '@/components/molecules/modal/MorkBorgModalActions';
import UnitTestProvider from '../../../UnitTestProvider';

describe('MorkBorgModalActions', () => {
  it('renders actions content', async () => {
    render(
      <UnitTestProvider>
        <MorkBorgModalActions actions={<Button>Action Button</Button>} />
      </UnitTestProvider>
    );

    expect(screen.getByRole('button', { name: 'Action Button' })).toBeTruthy();
  });
});
