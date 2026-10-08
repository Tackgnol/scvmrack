import { useTranslation } from 'react-i18next';
import { Seo } from '@/seo/Seo';
import { ForgeFlow } from '@/components/organisms/character-create/ForgeFlow';
import { useCharacter } from '@/CharacterContext/CharacterContext';

function readObrForgeContext(): { roomId?: string; playerId?: string } {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('obrRoom')?.trim();
  const playerId = params.get('obrPlayer')?.trim();
  return roomId && playerId ? { roomId, playerId } : {};
}
export function CharacterCreatePage() {
  const { t } = useTranslation();
  const { adoptCreatedCharacter } = useCharacter();
  const obrForge = readObrForgeContext();

  return (
    <>
      <Seo
        title={t('create.seoTitle', 'Forge a Scvm')}
        description="Pick a class, roll, re-roll, and create your MORK BORG character."
        path="/character/create"
        noIndex
      />

      <ForgeFlow
        onCreated={adoptCreatedCharacter}
        obrRoomId={obrForge.roomId}
        obrPlayerId={obrForge.playerId}
      />
    </>
  );
}
