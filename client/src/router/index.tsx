import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from '@/router/layout';
import { CharacterPage } from '@/pages/CharacterPage';
import { CharactersListPage } from '@/pages/CharactersListPage';
import { FaqPage } from '@/pages/FaqPage';
import { ReleasePage } from '@/pages/ReleasePage';

// Root route with layout
const rootRoute = createRootRoute({
    component: RootLayout,
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: CharacterPage,
});

const charactersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/characters',
    component: CharactersListPage,
});


const faqRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/faq',
    component: FaqPage,
});


const releaseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/release',
    component: ReleasePage,
});


const routeTree = rootRoute.addChildren([
    indexRoute,
    charactersRoute,
    faqRoute,
    releaseRoute,
]);


export const router = createRouter({ routeTree });


declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
