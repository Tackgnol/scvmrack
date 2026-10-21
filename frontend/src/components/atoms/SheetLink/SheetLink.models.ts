import type { ComponentPropsWithRef } from 'react';

export type SheetLinkProps = ComponentPropsWithRef<'a'> & {
  href: string;
};
