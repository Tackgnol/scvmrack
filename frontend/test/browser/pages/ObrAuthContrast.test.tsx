import { Box, Button, Paper, TextField } from '@mui/material';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Wrapper } from '@/pages/ObrAuthDonePage.styles';
import BrowserTestProvider from '../BrowserTestProvider';

describe('controls on yellow surfaces', () => {
  it('keeps the approval action outlined when its hover fill matches the page', async () => {
    await render(
      <BrowserTestProvider>
        <Wrapper>
          <Button variant="contained">Approve sign-in</Button>
        </Wrapper>
      </BrowserTestProvider>,
    );

    const approve = page.getByRole('button', { name: 'Approve sign-in' });
    await expect.element(approve).toBeVisible();
    await userEvent.hover(approve);
    const style = getComputedStyle(approve.element());
    expect(style.backgroundColor).toBe('rgb(255, 233, 0)');
    expect(style.color).toBe('rgb(10, 10, 10)');
    expect(style.borderTopStyle).toBe('solid');
    expect(parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(2);
    expect(style.borderTopColor).toBe('rgb(10, 10, 10)');
  });

  it('keeps floated labels and text actions readable without changing dark fields', async () => {
    await render(
      <BrowserTestProvider>
        <Wrapper>
          <Box>
            <TextField id="yellow-code" label="Code" />
            <Button>Cancel</Button>
          </Box>
        </Wrapper>
        <Paper>
          <TextField id="dark-code" label="Dark code" />
        </Paper>
      </BrowserTestProvider>,
    );

    for (const name of ['Code', 'Dark code']) {
      const field = page.getByRole('textbox', { name, exact: true });
      await expect.element(field).toBeVisible();
      await userEvent.fill(field, 'ABC123');
      const input = field.element();
      if (!(input instanceof HTMLInputElement) || !input.labels?.[0]) {
        throw new Error('The code field must have a label');
      }
      expect(getComputedStyle(input.labels[0]).color).toBe(
        name === 'Code' ? 'rgb(10, 10, 10)' : 'rgb(255, 233, 0)',
      );
      expect(getComputedStyle(input).color).toBe('rgb(245, 245, 245)');
      await userEvent.keyboard('{Tab}');
      expect(getComputedStyle(input.labels[0]).color).toBe(
        name === 'Code' ? 'rgb(10, 10, 10)' : 'rgb(255, 62, 181)',
      );
    }
    const cancel = page.getByRole('button', { name: 'Cancel' });
    await expect.element(cancel).toBeVisible();
    await expect.element(cancel).toHaveStyle({ color: 'rgb(10, 10, 10)' });
  });
});
