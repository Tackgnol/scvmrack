import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { StyledFlagButton } from './Flag.styled';

interface FlagProps {
    locale: 'en' | 'pl';
}

export function Flag({locale}: FlagProps) {
    const {locale: currentLocale, changeLocale} = useCharacter();
    const isActive = currentLocale === locale;
    const isUK = locale === 'en';
    const countryCode = locale === 'en' ? 'GB' : 'PL';

    const handleChange = async () => {
        await changeLocale(locale);
    }

    return (
        <StyledFlagButton
            type="button"
            onClick={handleChange}
            isActive={isActive}
            isUK={isUK}
            countryCode={countryCode}
            aria-label={locale === 'en' ? 'English' : 'Polski'}
        />
    );
}
