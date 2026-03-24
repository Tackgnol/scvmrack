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

const routeTree = rootRoute.addChildren([
    indexRoute,
    charactersRoute,
    faqRoute,
    releaseRoute,
    resetPasswordRoute,
]);


export const router = createRouter({
    routeTree,
    history: appHistory,
});


declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
