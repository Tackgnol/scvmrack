import { type UseCustomItemForm } from '@/hooks/useCustomItemForm';

// The slice of the form API every kind-panel needs. Keeps panel prop types in
// lockstep with the hook's actual shape.
export type CustomItemPanelProps = Pick<
  UseCustomItemForm,
  'state' | 'update' | 'fieldErrors'
>;
