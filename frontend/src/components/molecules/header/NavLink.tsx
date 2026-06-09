import { appHistory } from '@/router/history';
import { useRouterState } from '@tanstack/react-router';
import { type MouseEvent } from 'react';
import { StyledNavLink } from './Header.styled';

type NavLinkProps = {
  to: string;
  href?: string;
  text: string;
  onClick?: () => void;
  fullWidth?: boolean;
};

export function NavLink({ to, href, text, onClick, fullWidth }: NavLinkProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const destination = href ?? to;
  const isActive =
    to === '/character'
      ? pathname === '/character' || pathname.startsWith('/character/')
      : pathname === to;

  const handleClick = href
    ? (e: MouseEvent) => {
        e.preventDefault();
        onClick?.();
        void appHistory.push(href);
      }
    : onClick;

  return (
    <StyledNavLink
      to={destination}
      onClick={handleClick}
      isActive={isActive}
      fullWidth={fullWidth}
      data-testid={`nav-link-${to.replace(/\//g, '') || 'home'}`}
    >
      {text}
    </StyledNavLink>
  );
}
