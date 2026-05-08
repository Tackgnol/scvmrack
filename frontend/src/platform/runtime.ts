export const isBrowserRuntime = (): boolean => typeof document !== 'undefined';

export const getRuntimeOrigin = (): string | undefined => {
    if (!isBrowserRuntime()) {
        return undefined;
    }

    return document.location.origin;
};

export const getRuntimeDocumentTitle = (): string => {
    if (!isBrowserRuntime()) {
        return '';
    }

    return document.title;
};
