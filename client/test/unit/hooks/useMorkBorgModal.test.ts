import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const muiMocks = vi.hoisted(() => ({
  useMediaQuery: vi.fn(),
}));

vi.mock('@mui/material', () => ({
  useMediaQuery: muiMocks.useMediaQuery,
}));

import { useMorkBorgModal } from '../../../src/hooks/useMorkBorgModal.ts';

beforeEach(() => {
  muiMocks.useMediaQuery.mockReset();
});

test('useMorkBorgModal blocks backdrop/escape close when closeOnBackdrop is false', () => {
  const onClose = vi.fn();
  muiMocks.useMediaQuery.mockReturnValue(true);

  const { result } = renderHook(() =>
    useMorkBorgModal({
      closeOnBackdrop: false,
      onClose,
    }),
  );

  expect(result.current.transitionDuration).toBe(0);
  expect(result.current.paperSx.animation).toBe('none');

  act(() => {
    result.current.handleClose?.({} as never, 'backdropClick');
  });
  act(() => {
    result.current.handleClose?.({} as never, 'escapeKeyDown');
  });
  expect(onClose).not.toHaveBeenCalled();

  act(() => {
    result.current.handleClose?.({} as never, 'closeButtonClick' as never);
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('useMorkBorgModal allows backdrop close when closeOnBackdrop is true', () => {
  const onClose = vi.fn();
  muiMocks.useMediaQuery.mockReturnValue(false);

  const { result } = renderHook(() =>
    useMorkBorgModal({
      closeOnBackdrop: true,
      onClose,
    }),
  );

  expect(result.current.transitionDuration).toBe(260);
  expect(result.current.paperSx.animation).not.toBe('none');
  expect(result.current.paperSx.transformOrigin).toBe('top center');

  act(() => {
    result.current.handleClose?.({} as never, 'backdropClick');
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});
