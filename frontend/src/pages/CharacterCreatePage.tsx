import { useTranslation } from 'react-i18next';
import { Seo } from '@/seo/Seo';
import { ForgeFlow } from '@/components/organisms/character-create/ForgeFlow';
import { useCharacter } from '@/CharacterContext/CharacterContext';

export function CharacterCreatePage() {
  const { t } = useTranslation();
  const { adoptCreatedCharacter } = useCharacter();

  return (
    <>
      <Seo
        title={t('create.seoTitle', 'Forge a Scvm')}
        description="Pick a class, roll, re-roll, and create your MORK BORG character."
        path="/character/create"
        noIndex
      />

      <ForgeFlow onCreated={adoptCreatedCharacter} />
    </>
  );
}
