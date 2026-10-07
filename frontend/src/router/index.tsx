import { createRouter, createRootRoute, createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { appHistory } from '@/router/history';
import { RootLayout } from '@/router/layout';
import { CharacterCreatePage } from '@/pages/CharacterCreatePage';
import { OBR_AUTH_DONE_PATH } from '@tackgnol/rpgtools-shared-auth/client';
import { getViewTransitionTypes } from '@/router/routeClassification';

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

// Wrapped (not the bare CharacterPage) so a tab opened via ObrCharacterRoute's
// "Open in scvmrack" button can redeem its obrExchangeToken before the
// character load path runs — see ObrExchangeRedeemGate.
const characterIdRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/$characterId',
    component: lazyRouteComponent(() =>
        import('@/components/obr/ObrExchangeRedeemGate').then(m => ({ default: m.ObrExchangeRedeemGate }))
    ),
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

// The blind roll is gone (every party scvm goes through the class screen);
// old shared /roll links land on the forge.
const joinRollRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/join/$token/roll',
    beforeLoad: ({ params }) => {
        throw redirect({ to: '/join/$token/forge', params: { token: params.token } });
    },
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


const reportRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/report',
    component: lazyRouteComponent(() => import('@/pages/ReportPage').then(m => ({ default: m.ReportPage }))),
});
const moderationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/moderation',
    component: lazyRouteComponent(() => import('@/pages/ModerationPage').then(m => ({ default: m.ModerationPage }))),
});
const privacyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/privacy',
    component: lazyRouteComponent(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage }))),
});
const termsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/terms',
    component: lazyRouteComponent(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage }))),
});

const legalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/legal',
    component: lazyRouteComponent(() => import('@/pages/LegalPage').then(m => ({ default: m.LegalPage }))),
});

const releaseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/release',
    component: lazyRouteComponent(() => import('@/pages/ReleasePage').then(m => ({ default: m.ReleasePage }))),
});

const owlbearRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/owlbear',
    component: lazyRouteComponent(() => import('@/pages/OwlbearGuidePage').then(m => ({ default: m.OwlbearGuidePage }))),
});

const gmRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm',
    component: lazyRouteComponent(() => import('@/pages/GmOverviewPage').then(m => ({ default: m.GmOverviewPage }))),
});

const classDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/classes/$classId',
    component: lazyRouteComponent(() => import('@/pages/ClassDetailPage').then(m => ({ default: m.ClassDetailPage }))),
});

const classesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm/classes',
    component: lazyRouteComponent(() => import('@/pages/ClassesPage').then(m => ({ default: m.ClassesPage }))),
});

const loadClassCreatorPage = () => import('@/pages/ClassCreatorPage').then(m => ({ default: m.ClassCreatorPage }));

const classNewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm/classes/new',
    component: lazyRouteComponent(loadClassCreatorPage),
});

const classDraftRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm/classes/draft/$draftId',
    component: lazyRouteComponent(loadClassCreatorPage),
});

const classEditRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gm/classes/$classId',
    component: lazyRouteComponent(loadClassCreatorPage),
});

// Carries the OBR iframe's session into a new first-party character tab.
const obrOpenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/obr-open',
    component: lazyRouteComponent(() => import('@/pages/ObrOpenPage').then(m => ({ default: m.ObrOpenPage }))),
});


// Popup callback for Owlbear Rodeo sign-in. Hands the token back, then closes.
const obrAuthDoneRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: OBR_AUTH_DONE_PATH,
    component: lazyRouteComponent(() => import('@/pages/ObrAuthDonePage').then(m => ({ default: m.ObrAuthDonePage }))),
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
    reportRoute,
    privacyRoute,
    moderationRoute,
    termsRoute,
    legalRoute,
    releaseRoute,
    owlbearRoute,
    gmRoute,
    classDetailRoute,
    classesRoute,
    classNewRoute,
    classDraftRoute,
    classEditRoute,
    obrAuthDoneRoute,
    obrOpenRoute,
]);

export const router = createRouter({
    routeTree,
    history: appHistory,
    // Preload each route's lazy chunk on hover/touch intent so the component is
    // ready by click time. Without this, navigating to an unvisited route leaves
    // the content area blank while the chunk downloads, which reads as a flash.
    defaultPreload: 'intent',
    defaultViewTransition: {
        types: ({ fromLocation, toLocation }) =>
            getViewTransitionTypes(fromLocation?.pathname, toLocation.pathname),
    },
    defaultNotFoundComponent: () => <NotFoundComponent />,
});


declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
