import { createRouter, createRootRoute, createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { appHistory } from '@/router/history';
import { RootLayout } from '@/router/layout';
import { CharacterCreatePage } from '@/pages/CharacterCreatePage';

const NotFoundComponent = lazyRouteComponent(() =>
    import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
);

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

const characterTrailingSlashRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/',
    component: NotFoundComponent,
});

const characterNewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/new',
    component: lazyRouteComponent(() => import('@/pages/CharacterPage').then(m => ({ default: m.CharacterPage }))),
});

const characterCreateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/create',
    component: CharacterCreatePage,
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

const partyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/party/$partyId',
    component: lazyRouteComponent(() => import('@/pages/PartyPage').then(m => ({ default: m.PartyPage }))),
});

const partyCharacterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/party/$partyId/character/$characterId',
    component: lazyRouteComponent(() => import('@/pages/PartyCharacterPage').then(m => ({ default: m.PartyCharacterPage }))),
});

const joinRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/join/$token',
    component: lazyRouteComponent(() => import('@/pages/JoinPartyPage').then(m => ({ default: m.JoinPartyPage }))),
});

const joinForgeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/join/$token/forge',
    component: lazyRouteComponent(() => import('@/pages/JoinForgePage').then(m => ({ default: m.JoinForgePage }))),
});

const joinRollRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/join/$token/roll',
    component: lazyRouteComponent(() => import('@/pages/JoinRollPage').then(m => ({ default: m.JoinRollPage }))),
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

const gmRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm',
    component: lazyRouteComponent(() => import('@/pages/GmOverviewPage').then(m => ({ default: m.GmOverviewPage }))),
});

const routeTree = rootRoute.addChildren([
    indexRoute,
    characterRoute,
    characterTrailingSlashRoute,
    characterNewRoute,
    characterCreateRoute,
    characterIdRoute,
    charactersRoute,
    partyRoute,
    partyCharacterRoute,
    joinRoute,
    joinForgeRoute,
    joinRollRoute,
    printRoute,
    faqRoute,
    releaseRoute,
    gmRoute,
]);

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
