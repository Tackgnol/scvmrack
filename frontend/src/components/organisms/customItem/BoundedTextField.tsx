import { TextField } from '@mui/material';
import { type ComponentProps, type ReactNode } from 'react';
import { FIELD_BOUNDS, type FieldName } from '@/hooks/useCustomItemForm';
import { modalInputStyles } from './panelStyles';

function formatRange(field: FieldName): string {
  const { min, max } = FIELD_BOUNDS[field];
  return `${min}–${max.toLocaleString()}`;
}

// Pairs a numeric TextField with a permanent range hint. When the value is out of
// range the hint flips to the field's error state, but the boundary is always
// visible — users see the limit up front rather than being silently clamped.
export function BoundedTextField({
  field,
  state,
  fieldErrors,
  helperText,
  inputProps,
  ...props
}: Omit<ComponentProps<typeof TextField>, 'error' | 'helperText'> & {
  field: FieldName;
  state: string;
  fieldErrors: Record<FieldName, boolean>;
  helperText?: ReactNode;
  inputProps?: Record<string, unknown>;
}) {
  const error = fieldErrors[field];
  const range = formatRange(field);
  const hint = helperText ? `${helperText} · ${range}` : range;

  return (
    <TextField
      {...props}
      value={state}
      type="number"
      error={error}
      helperText={hint}
      sx={modalInputStyles}
      slotProps={{
        htmlInput: {
          min: FIELD_BOUNDS[field].min,
          max: FIELD_BOUNDS[field].max,
          ...(inputProps ?? {}),
        },
      }}
    />
  );
}
