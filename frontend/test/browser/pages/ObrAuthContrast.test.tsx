import { Box, Button, Paper, TextField } from '@mui/material';
import { assert, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ObrAuthWrapper } from '@/pages/obrAuth.styles';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import BrowserTestProvider from '../BrowserTestProvider';

describe('controls on yellow surfaces', () => {
  it('keeps the approval action outlined when its hover fill matches the page', async () => {
    await render(
      <BrowserTestProvider>
        <ObrAuthWrapper>
          <Button variant="contained">Approve sign-in</Button>
        </ObrAuthWrapper>
        <Paper>
          <Button variant="contained">Other action</Button>
        </Paper>
      </BrowserTestProvider>,
    );

    const approve = page.getByRole('button', { name: 'Approve sign-in' });
    await expect.element(approve).toBeVisible();
    await userEvent.hover(approve);
    await expect.element(approve).toHaveStyle({
      backgroundColor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      borderTopStyle: 'solid',
      borderTopWidth: '2px',
      borderTopColor: morkBorgColors.black,
    });
    const other = page.getByRole('button', { name: 'Other action' });
    await expect.element(other).toBeVisible();
    await expect.element(other).toHaveStyle({ borderTopStyle: 'none' });
  });

  it('keeps floated labels and text actions readable without changing dark fields', async () => {
    await render(
      <BrowserTestProvider>
        <ObrAuthWrapper>
          <Box>
            <TextField id="yellow-code" label="Code" />
            <Button>Cancel</Button>
          </Box>
          <Paper>
            <TextField id="dark-code" label="Dark code" />
            <Button>Dark cancel</Button>
          </Paper>
        </ObrAuthWrapper>
      </BrowserTestProvider>,
    );

    for (const name of ['Code', 'Dark code']) {
      const field = page.getByRole('textbox', { name, exact: true });
      await expect.element(field).toBeVisible();
      await userEvent.fill(field, 'ABC123');
      const input = field.element();
      assert(input instanceof HTMLInputElement);
      const label = input.labels?.[0];
      assert(label);
      await expect.element(label).toHaveStyle({
        color: name === 'Code' ? morkBorgColors.black : morkBorgColors.yellow,
      });
      await expect.element(input).toHaveStyle({ color: morkBorgColors.white });
      await userEvent.keyboard('{Tab}');
      await expect.element(label).toHaveStyle({
        color: name === 'Code' ? morkBorgColors.black : morkBorgColors.pink,
      });
    }
    const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
    await expect.element(cancel).toBeVisible();
    await expect.element(cancel).toHaveStyle({ color: morkBorgColors.black });
    const darkCancel = page.getByRole('button', { name: 'Dark cancel' });
    await expect.element(darkCancel).toBeVisible();
    await expect.element(darkCancel).toHaveStyle({ color: morkBorgColors.yellow });
  });
});
