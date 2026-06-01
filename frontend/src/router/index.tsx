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
    component: lazyRouteComponent(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage }))),
});

const characterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character',
    component: lazyRouteComponent(() => import('@/pages/CharacterPage').then(m => ({ default: m.CharacterPage }))),
});

const characterIdRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/$characterId',
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

const routeTree = rootRoute.addChildren([
    indexRoute,
    characterRoute,
    characterIdRoute,
    charactersRoute,
    printRoute,
    faqRoute,
    releaseRoute,
]);

const NotFoundComponent = lazyRouteComponent(() =>
    import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
);

export const router = createRouter({
    routeTree,
    history: appHistory,
    // Preload each route's lazy chunk on hover/touch intent so the component is
    // ready by click time. Without this, navigating to an unvisited route leaves
    // the content area blank while the chunk downloads, which reads as a flash.
    defaultPreload: 'intent',
    defaultNotFoundComponent: () => <NotFoundComponent />,
});


declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
