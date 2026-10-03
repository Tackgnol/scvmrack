import { describe, expect, it } from 'vitest';
import { parseStepperText } from '@/components/atoms/NumberStepper/NumberStepper.utils';

describe('parseStepperText', () => {
  it('reads whole numbers with a hyphen, true minus, en dash or plus', () => {
    expect(['3', '-2', '−2', '–2', '+4', ' 5 '].map(parseStepperText)).toEqual([3, -2, -2, -2, 4, 5]);
  });

  it('refuses anything else', () => {
    expect(['', 'x', '2.5', '--1'].map(parseStepperText)).toEqual([null, null, null, null]);
  });
});
