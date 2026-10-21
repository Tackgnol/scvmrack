import { Link, useRouter } from '@tanstack/react-router';
import type { SheetLinkProps } from './SheetLink.models';

/** Sheets also render in Owlbear without a router; keep that room open. */
export default function SheetLink({ to, params, search, children, ...props }: SheetLinkProps) {
  const router = useRouter({ warn: false });
  if (!router) {
    const href = params ? `/classes/${encodeURIComponent(params.classId)}` : `/report?${new URLSearchParams(search)}`;
    return <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  if (to === '/classes/$classId') {
    return <Link {...props} to={to} params={params}>{children}</Link>;
  }
  return <Link {...props} to={to} search={search as never}>{children}</Link>;
}
