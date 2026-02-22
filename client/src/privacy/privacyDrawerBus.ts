type OpenPrivacyDrawerListener = () => void;

const openPrivacyDrawerListeners = new Set<OpenPrivacyDrawerListener>();

export const subscribeOpenPrivacyDrawer = (
    listener: OpenPrivacyDrawerListener
): (() => void) => {
    openPrivacyDrawerListeners.add(listener);

    return () => {
        openPrivacyDrawerListeners.delete(listener);
    };
};

export const requestOpenPrivacyDrawer = (): void => {
    openPrivacyDrawerListeners.forEach((listener) => listener());
};
