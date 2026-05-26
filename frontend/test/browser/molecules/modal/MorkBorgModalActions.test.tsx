import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import { Button } from '@mui/material';
import MorkBorgModalActions from '@/components/molecules/modal/MorkBorgModalActions';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('MorkBorgModalActions Browser', () => {
  it('renders actions content', async () => {
    await render(
      <BrowserTestProvider>
        <MorkBorgModalActions actions={<Button>Action Button</Button>} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByRole('button', { name: 'Action Button' })).toBeVisible();

  });
});
