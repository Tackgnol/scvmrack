import type { TFunction } from 'i18next';
import type { CharacterListItem } from '@/hooks/models';

export function getCharacterClassLabel(character: CharacterListItem | null, t: TFunction): string {
  return character?.className?.trim() || (character?.classId === null
    ? t('create.classlessLabel', 'Classless')
    : t('characters.unknownClass', 'Unknown'));
}
