// Auto-generated from pl.json - do not edit manually
// Regenerate with: copy pl.json structure and update this file

export interface TranslationKeys {
    app: {
        title: string;
        subtitle: string;
    };
    stats: {
        hitPoints: string;
        toDodge: string;
        toHit: string;
        omens: string;
        silver: string;
        armor: string;
        encumbrance: string;
        armorTier: string;
    };
    attributes: {
        agility: string;
        presence: string;
        strength: string;
        toughness: string;
        agilityDesc: string;
        presenceDesc: string;
        strengthDesc: string;
        toughnessDesc: string;
    };
    equipment: {
        weapon: string;
        armorLabel: string;
        onHand: string;
        storedItems: string;
        readyItemPlaceholder: string;
        itemDescriptionPlaceholder: string;
        unarmed: string;
        unarmored: string;
        none: string;
        itemDetails: string;
        itemName: string;
        quantity: string;
        backpack: string;
        sell: string;
        drop: string;
        save: string;
        equippedGear: string;
        namePlaceholder: string;
        detailPlaceholder: string;
        offHand: string;
        other: string;
        damagePlaceholder: string;
        offHandPlaceholder: string;
        tierPlaceholder: string;
        effectPlaceholder: string;
        addItem: string;
        searchPlaceholder: string;
        typeToSearch: string;
        noResults: string;
    };
    character: {
        name: string;
        class: string;
        origin: string;
        originPlaceholder: string;
        abilities: string;
        classAbilities: string;
        abilityName: string;
        description: string;
        noCharacterLoaded: string;
        traitDescription: string;
    };
    traits: {
        title: string;
        trait1: string;
        trait2: string;
        habit: string;
        bodyDescription: string;
    };
    notes: {
        title: string;
        placeholder: string;
    };
    footer: {
        worldEnding: string;
    };
    actions: {
        generateNew: string;
        testModal: string;
    };
    powers: {
        title: string;
        noScrollsOrPowers: string;
    };
    auth: {
        login: string;
        signup: string;
        logout: string;
        profile: string;
        email: string;
        password: string;
        name: string;
        passwordHint: string;
        loginFailed: string;
        signupFailed: string;
        loginSignup: string;
        claimTitle: string;
        claimPrompt: string;
        claimYes: string;
        claimNo: string;
        claimFailed: string;
        guestCharacterNotice: string;
        // New keys for email verification flow
        verified: string;
        emailNotVerified: string;
        verifyEmailTitle: string;
        verifyEmailDesc: string;
        characterWillBeSaved: string;
        checkEmailTitle: string;
        checkEmailDesc: string;
        tryAgain: string;
        or: string;
        sendMagicLink: string;
        magicLinkFailed: string;
        emailRequired: string;
    };
    session: {
        expiresWarning: string;
        expiresWarning_one: string;
        signUpKeepForever: string;
        extend7Days: string;
        extended: string;
        extendFailed: string;
        loggedOut: string;
        createNewCharacter: string;
    };
    status: {
        saving: string;
        saved: string;
        synced: string;
        guest: string;
        guestSession: string;
        connectionError: string;
    };
    common: {
        close: string;
    };
}

// Flattened dot-notation keys for t() function
export type TranslationKey =
    | `app.${keyof TranslationKeys['app']}`
    | `stats.${keyof TranslationKeys['stats']}`
    | `attributes.${keyof TranslationKeys['attributes']}`
    | `equipment.${keyof TranslationKeys['equipment']}`
    | `character.${keyof TranslationKeys['character']}`
    | `traits.${keyof TranslationKeys['traits']}`
    | `notes.${keyof TranslationKeys['notes']}`
    | `footer.${keyof TranslationKeys['footer']}`
    | `actions.${keyof TranslationKeys['actions']}`
    | `powers.${keyof TranslationKeys['powers']}`
    | `auth.${keyof TranslationKeys['auth']}`
    | `session.${keyof TranslationKeys['session']}`
    | `status.${keyof TranslationKeys['status']}`
    | `common.${keyof TranslationKeys['common']}`;

// Type-safe t() function overload (add to your i18n setup)
declare module 'react-i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: TranslationKeys;
        };
    }
}
