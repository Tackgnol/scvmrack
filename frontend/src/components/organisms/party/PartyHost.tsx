import { PartyPullTab } from '@/components/molecules/party/PartyPullTab';
import {
  closeParty,
  useIsPartyOpen,
} from '@/components/organisms/party/partyStore';
import { PartyView } from '@/components/organisms/party/PartyView';
import { useParty } from '@/hooks/useParty';

// Mount point for the party takeover. Owns the warband list query and the open/close
// wiring so the rest of the app's triggers (header pill, edge pull-tab) only need to
// call openParty(). The pull-tab shows while the takeover is closed and the rack has
// scvms; the drawer itself stays mounted so it can animate in and out.
export function PartyHost() {
  const open = useIsPartyOpen();
  const { members, count } = useParty();

  return (
    <>
      {!open && <PartyPullTab count={count} />}
      <PartyView open={open} onClose={closeParty} members={members} />
    </>
  );
}
