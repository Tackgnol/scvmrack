import { useEffect, useState } from 'react';

type PulseState<T> = {
  value: T;
  disabled: boolean;
  pulse: boolean;
};

export function useValuePulse<T>(
  value: T,
  disabled = false,
  durationMs = 180,
): boolean {
  const normalizedDisabled = disabled || durationMs <= 0;
  const [state, setState] = useState<PulseState<T>>(() => ({
    value,
    disabled: normalizedDisabled,
    pulse: false,
  }));

  if (state.value !== value || state.disabled !== normalizedDisabled) {
    setState({
      value,
      disabled: normalizedDisabled,
      pulse: !normalizedDisabled && state.value !== value,
    });
  }

  useEffect(() => {
    if (!state.pulse) return;

    const timeoutId = window.setTimeout(() => {
      setState((previous) =>
        previous.value === value
          ? {
              ...previous,
              pulse: false,
            }
          : previous,
      );
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, state.pulse, value]);

  return state.pulse;
}

