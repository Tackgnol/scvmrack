import { useAuth } from '@/hooks/useAuth';
import { usePrivacyAcknowledged } from '@/privacy/privacyConsent';
import { toApiClientError } from '@/utils/errorUtils';

/** Session activation and read permissions for the current character flow. */
export function useCharacterSession({
  pathname,
  characterId,
  isJustLoggedOut,
}: {
  pathname: string;
  characterId: string | null;
  isJustLoggedOut: boolean;
}) {
  const privacyAcknowledged = usePrivacyAcknowledged();
  const isCreationRoute = pathname === '/character' || pathname === '/character/new';
  const auth = useAuth({
    bootstrapAnonymous: isCreationRoute && !characterId && privacyAcknowledged && !isJustLoggedOut,
  });
  const canAutoCreate = !auth.isLoading && (auth.isAuthenticated || auth.isGuest);
  const canReadCharacter = !auth.isLoading && !auth.isSessionless;
  const error = auth.error ?? (characterId && auth.isSessionless
    ? toApiClientError({ status: 401, message: 'A session is required to open this character' })
    : null);

  return { ...auth, error, privacyAcknowledged, canAutoCreate, canReadCharacter };
}
