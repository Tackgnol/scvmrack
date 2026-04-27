/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL?: string;
    readonly VITE_TURNSTILE_SITE_KEY?: string;
    readonly VITE_SITE_URL?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_GLITCHTIP_DSN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
