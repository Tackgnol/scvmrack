import { trackEvent } from '@/analytics/googleAnalytics';
import { useAuth } from '@/hooks/useAuth.ts';
import { useTurnstileChallenge } from '@/hooks/useTurnstileChallenge';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { clearCurrentSearchParam, LOGGED_OUT_QUERY_PARAM } from '@/router/navigation';
import { customStyles } from '@theme/morkBorgTheme';
import { TurnstileWidget } from './TurnstileWidget';
import MorkBorgModal from './MorkBorgModal';

const PENDING_CLAIM_KEY = 'pending-claim-character-id';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  sessionExpiredNotice?: boolean;
}

type TabValue = 'login' | 'signup';

export function AuthModal({
  open,
  onClose,
  sessionExpiredNotice = false,
}: AuthModalProps) {
  const { t, i18n } = useTranslation();
  const {
    user,
    isAuthenticated,
    isGuest,
    signIn,
    signUp,
    signOut,
    signInMagicLink,
  } = useAuth();

  const { character, claimCharacter, isClaiming, characterId, isJustLoggedOut, generateNew } =
    useCharacter();

  const [tab, setTab] = useState<TabValue>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showClaimPrompt, setShowClaimPrompt] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const turnstileEnabled = Boolean(turnstileSiteKey);
  const turnstileMissingToken = useCallback(() => {
    setError('Please verify that you are human.');
  }, []);
  const {
    token: turnstileToken,
    resetSignal: turnstileResetSignal,
    onTokenChange: onTurnstileTokenChange,
    reset: resetTurnstile,
    ensureToken: ensureTurnstileToken,
  } = useTurnstileChallenge({
    enabled: turnstileEnabled,
    onMissingToken: turnstileMissingToken,
  });
  const analyticsLocale = i18n.resolvedLanguage ?? i18n.language ?? 'unknown';

  // Check for pending claim on mount / when user becomes verified
  useEffect(() => {
    if (isAuthenticated && user?.emailVerified) {
      const pendingClaimId = localStorage.getItem(PENDING_CLAIM_KEY);
      if (pendingClaimId) {
        // User just verified and has a pending claim
        setShowClaimPrompt(true);
      }
    }
  }, [isAuthenticated, user?.emailVerified]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setName('');
      setError(null);
      setShowVerifyEmail(false);
      setTab('login');
      setMagicLinkSent(false);
      resetTurnstile();

      // Check if we should show claim prompt (user just verified via email link)
      if (isAuthenticated && user?.emailVerified) {
        const pendingClaimId = localStorage.getItem(PENDING_CLAIM_KEY);
        if (pendingClaimId) {
          setShowClaimPrompt(true);
        }
      }
    }
  }, [open, isAuthenticated, user?.emailVerified, resetTurnstile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ensureTurnstileToken()) {
      return;
    }

    try {
      await signIn.mutateAsync({
        email,
        password,
        turnstileToken: turnstileToken ?? undefined,
        locale: analyticsLocale,
        wasGuest: isGuest,
        hadGuestCharacter: Boolean(characterId),
      });

      // If user was guest with a character, offer to claim it
      if (isGuest && character) {
        setShowClaimPrompt(true);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      if (turnstileEnabled) {
        resetTurnstile();
      }
    }
  };

  const handleMagicLinkRequest = async () => {
    if (!email) {
      setError(t('auth.emailRequired', 'Email is required for magic links'));
      return;
    }
    setError(null);

    if (!ensureTurnstileToken()) {
      return;
    }

    try {
      // Store pending claim before magic link (user will be logged in after clicking)
      if (isGuest && characterId) {
        localStorage.setItem(PENDING_CLAIM_KEY, characterId);
      }
      await signInMagicLink.mutateAsync({
        email,
        turnstileToken: turnstileToken ?? undefined,
        locale: analyticsLocale,
        wasGuest: isGuest,
        hadGuestCharacter: Boolean(characterId),
      });
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.magicLinkFailed'));
    } finally {
      if (turnstileEnabled) {
        resetTurnstile();
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ensureTurnstileToken()) {
      return;
    }

    try {
      // Store pending claim BEFORE signup
      if (isGuest && characterId) {
        localStorage.setItem(PENDING_CLAIM_KEY, characterId);
      }

      await signUp.mutateAsync({
        email,
        password,
        name,
        turnstileToken: turnstileToken ?? undefined,
        locale: analyticsLocale,
        wasGuest: isGuest,
        hadGuestCharacter: Boolean(characterId),
      });

      // Show "check your email" instead of claim prompt
      setShowVerifyEmail(true);
    } catch (err) {
      // Clear pending claim on error
      localStorage.removeItem(PENDING_CLAIM_KEY);
      setError(err instanceof Error ? err.message : t('auth.signupFailed'));
    } finally {
      if (turnstileEnabled) {
        resetTurnstile();
      }
    }
  };

  const handleClaim = async (shouldClaim: boolean) => {
    if (shouldClaim) {
      try {
        const pendingClaimId = localStorage.getItem(PENDING_CLAIM_KEY);
        await claimCharacter(pendingClaimId || undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('auth.claimFailed'));
        return;
      }
    } else {
      trackEvent('claim_character_skipped', {
        locale: analyticsLocale,
        had_guest_character: Boolean(characterId),
      });
    }
    // Clear pending claim
    localStorage.removeItem(PENDING_CLAIM_KEY);
    setShowClaimPrompt(false);
    onClose();
  };

  const handleLogout = async () => {
    await signOut.mutateAsync();
  };

  const handleCreateNew = async () => {
    await clearCurrentSearchParam(LOGGED_OUT_QUERY_PARAM);
    generateNew();
    onClose();
  };

  if (isJustLoggedOut && !character) {
    return (
      <MorkBorgModal
        open={open}
        onClose={() => {}}
        closeOnBackdrop={false}
        showCloseButton={false}
        maxWidth="xs"
        title={t('session.loggedOut')}
      >
        <Box sx={customStyles.authModal.buttonGap}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateNew}
          >
            {t("session.createNewCharacter")}
          </Button>
        </Box>
      </MorkBorgModal>
    );
  }

  if (showClaimPrompt) {
    const charName = character?.name || 'your character';

    return (
      <MorkBorgModal
        open={open}
        onClose={() => {}}
        closeOnBackdrop={false}
        showCloseButton={false}
        maxWidth="xs"
        title={t('auth.claimTitle')}
      >
        <Typography sx={customStyles.authModal.titleMarginLarge}>
          {t('auth.claimPrompt', { characterName: charName })}
        </Typography>
        <Box sx={customStyles.authModal.buttonGap}>
          <Button
            variant="contained"
            onClick={() => handleClaim(true)}
            disabled={isClaiming}
            fullWidth
          >
            {isClaiming ? <CircularProgress size={24} /> : t('auth.claimYes')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleClaim(false)}
            disabled={isClaiming}
            fullWidth
          >
            {t('auth.claimNo')}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={customStyles.authErrorAlert}>
            {error}
          </Alert>
        )}
      </MorkBorgModal>
    );
  }

  // --- VIEW: VERIFY EMAIL (after signup) ---
  if (showVerifyEmail) {
    return (
      <MorkBorgModal
        open={open}
        onClose={onClose}
        maxWidth="xs"
        title={t('auth.verifyEmailTitle', 'CHECK YOUR SCROLL')}
      >
        <Typography sx={customStyles.authModal.textCenter}>
          {t(
            'auth.verifyEmailDesc',
            "We've sent a verification link to your email. Click it to complete your registration."
          )}
        </Typography>
        {isGuest && character && (
          <Alert severity="info" sx={customStyles.authModal.infoAlert}>
            {t('auth.characterWillBeSaved', {
              characterName: character.name || 'Your character',
              defaultValue:
                '{{characterName}} will be saved to your account after verification.',
            })}
          </Alert>
        )}
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            setShowVerifyEmail(false);
            onClose();
          }}
        >
          {t('common.close', 'Close')}
        </Button>
      </MorkBorgModal>
    );
  }

  // --- VIEW: AUTHENTICATED PROFILE ---
  if (isAuthenticated) {
    return (
      <MorkBorgModal
        open={open}
        onClose={onClose}
        maxWidth="xs"
        title={t('auth.profile')}
      >
        <Typography sx={customStyles.authModal.titleMargin}>
          <strong>{t('auth.name')}:</strong> {user?.name}
        </Typography>
        <Typography sx={customStyles.authModal.titleMargin}>
          <strong>{t('auth.email')}:</strong> {user?.email}
        </Typography>
        <Typography sx={customStyles.authModal.titleMarginLarge}>
          <strong>{t('auth.verified')}:</strong>{' '}
          {user?.emailVerified ? '✓' : '✗'}
        </Typography>

        {!user?.emailVerified && (
          <Alert severity="warning" sx={customStyles.authModal.warningAlert}>
            {t(
              'auth.emailNotVerified',
              'Your email is not verified. Check your inbox for a verification link.'
            )}
          </Alert>
        )}

        <Divider sx={customStyles.authModal.sectionDivider} />
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          disabled={signOut.isPending}
          fullWidth
        >
          {signOut.isPending ? (
            <CircularProgress size={24} />
          ) : (
            t('auth.logout')
          )}
        </Button>
      </MorkBorgModal>
    );
  }

  // --- VIEW: LOGIN / SIGNUP TABS ---
  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      maxWidth="xs"
      title={tab === 'login' ? t('auth.login') : t('auth.signup')}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setError(null);
          setMagicLinkSent(false);
          resetTurnstile();
        }}
        sx={customStyles.authModal.titleMarginLarge}
      >
        <Tab value="login" label={t('auth.login')} />
        <Tab value="signup" label={t('auth.signup')} />
      </Tabs>
      {sessionExpiredNotice && (
        <Alert severity="warning" sx={customStyles.authModal.infoAlert}>
          {t(
            'auth.sessionExpired',
            'Your session expired. Sign in again to continue.'
          )}
        </Alert>
      )}

      {tab === 'login' && (
        <Box>
          {magicLinkSent ? (
            <Box sx={customStyles.authModal.centeredBox}>
              <Typography variant="h6" sx={customStyles.authModal.title}>
                {t('auth.checkEmailTitle', 'SOULS DISPATCHED')}
              </Typography>
              <Typography sx={customStyles.authModal.titleMarginLarge}>
                {t(
                  'auth.checkEmailDesc',
                  'A magic link has been sent to your scroll (email).'
                )}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setMagicLinkSent(false)}
              >
                {t('auth.tryAgain', 'Back to Login')}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                sx={customStyles.authModal.textField}
              />
              <TextField
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                sx={customStyles.authModal.textFieldLast}
              />
              {turnstileEnabled && (
                <TurnstileWidget
                  siteKey={turnstileSiteKey!}
                  onTokenChange={onTurnstileTokenChange}
                  resetSignal={turnstileResetSignal}
                />
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={signIn.isPending || (turnstileEnabled && !turnstileToken)}
              >
                {signIn.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  t('auth.login')
                )}
              </Button>

              <Divider sx={customStyles.authModal.divider}>
                <Typography variant="caption" sx={customStyles.authDividerText}>
                  {t('auth.or', 'OR')}
                </Typography>
              </Divider>

              <Button
                variant="text"
                fullWidth
                onClick={handleMagicLinkRequest}
                disabled={signInMagicLink.isPending || (turnstileEnabled && !turnstileToken)}
                sx={customStyles.authModal.magicLinkButton}
              >
                {signInMagicLink.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t('auth.sendMagicLink', 'Email me a Magic Link')
                )}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {tab === 'signup' && (
        <Box component="form" onSubmit={handleSignup}>
          <TextField
            label={t('auth.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            sx={customStyles.authModal.textField}
          />
          <TextField
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={customStyles.authModal.textField}
          />
          <TextField
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            slotProps={{ htmlInput: { minLength: 8 } }}
            helperText={t('auth.passwordHint')}
            sx={customStyles.authModal.textFieldLast}
          />
          {isGuest && character && (
            <Alert severity="info" sx={customStyles.authModal.infoAlert}>
              {t('auth.guestCharacterNotice', {
                characterName: character.name || 'Your character',
              })}
            </Alert>
          )}
          {turnstileEnabled && (
            <TurnstileWidget
              siteKey={turnstileSiteKey!}
              onTokenChange={onTurnstileTokenChange}
              resetSignal={turnstileResetSignal}
            />
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={signUp.isPending || (turnstileEnabled && !turnstileToken)}
          >
            {signUp.isPending ? (
              <CircularProgress size={24} />
            ) : (
              t('auth.signup')
            )}
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={customStyles.authModal.errorAlert}>
          {error}
        </Alert>
      )}
    </MorkBorgModal>
  );
}
