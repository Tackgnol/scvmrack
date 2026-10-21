import type { ComponentPropsWithRef } from 'react';

export type SheetLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & (
  | { to: '/classes/$classId'; params: { classId: string }; search?: never }
  | { to: '/report'; search: { classId: string }; params?: never }
);
