import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useTranslation } from 'react-i18next';

export function useCharacterNameAndClass() {
  const { character, isLoading } = useCharacter();
  const { t } = useTranslation();

  return {
    character,
    isLoading,
    hasCharacter: Boolean(character),
    noCharacterLoadedText: t('character.noCharacterLoaded'),
    nameLabel: t('character.name'),
    classLabel: t('character.class'),
    fallbackName: t('character.unnamedWretch'),
    fallbackTrait1: t('character.mysterious'),
    fallbackTrait2: t('character.unknown'),
    fallbackTraitClass: t('character.wretch'),
    fallbackClassName: t('character.classless'),
  };
}
