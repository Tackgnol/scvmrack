import { createRouter, createRootRoute, createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { appHistory } from '@/router/history';
import { RootLayout } from '@/router/layout';

// Root route with layout
const rootRoute = createRootRoute({
    component: RootLayout,
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: lazyRouteComponent(() => import('@/pages/CharacterPage').then(m => ({ default: m.CharacterPage }))),
});

const charactersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/characters',
    component: lazyRouteComponent(() => import('@/pages/CharactersListPage').then(m => ({ default: m.CharactersListPage }))),
});

const printRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/print',
    component: lazyRouteComponent(() => import('@/pages/PrintPage').then(m => ({ default: m.PrintPage }))),
});

const faqRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/faq',
    component: lazyRouteComponent(() => import('@/pages/FaqPage').then(m => ({ default: m.FaqPage }))),
});


const releaseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/release',
    component: lazyRouteComponent(() => import('@/pages/ReleasePage').then(m => ({ default: m.ReleasePage }))),
});

const resetPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reset-password',
    component: lazyRouteComponent(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))),
});

const glitchTipRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/glitchtip',
    component: lazyRouteComponent(() => import('@/pages/GlitchTipPage').then(m => ({ default: m.GlitchTipPage }))),
});

const routeTree = rootRoute.addChildren([
    indexRoute,
    charactersRoute,
    printRoute,
    faqRoute,
    releaseRoute,
    resetPasswordRoute,
    glitchTipRoute,
]);


const NotFoundComponent = lazyRouteComponent(() =>
    import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
);

export const router = createRouter({
    routeTree,
    history: appHistory,
    defaultNotFoundComponent: () => <NotFoundComponent />,
});


declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
