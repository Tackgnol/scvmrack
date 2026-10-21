import { Link, useRouter } from '@tanstack/react-router';
import type { SheetLinkProps } from './SheetLink.models';

/** Sheets also render in Owlbear without a router; keep that room open. */
export default function SheetLink({ href, children, ...props }: SheetLinkProps) {
  const router = useRouter({ warn: false });
  if (!router) {
    return <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link {...props} to={href}>{children}</Link>;
}
