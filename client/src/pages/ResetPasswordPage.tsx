import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { customStyles, morkBorgColors } from '@theme/morkBorgTheme';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Better Auth puts the token in the URL search params
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // Focus management: move focus to success heading when success state renders
  useEffect(() => {
    if (success) {
      const successHeading = document.querySelector('[data-testid="reset-success-heading"]');
      if (successHeading) {
        (successHeading as HTMLElement).focus();
      }
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsMismatch', 'Passwords do not match.'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.passwordHint', 'Minimum 8 characters'));
      return;
    }

    if (!token) {
      setError(t('auth.invalidResetLink', 'Invalid or expired reset link.'));
      return;
    }

    try {
      await resetPassword.mutateAsync({ newPassword, token });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('auth.resetFailed', 'Password reset failed. The link may have expired.')
      );
    }
  };

  if (!token) {
    return (
      <Box sx={{ maxWidth: 'min(400px, 100vw - 32px)', mx: 'auto', mt: 8, px: 2 }}>
        <Alert severity="error" sx={customStyles.authErrorAlert} role="alert">
          {t('auth.invalidResetLink', 'Invalid or expired reset link.')}
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button
            variant="contained"
            fullWidth
            href="/"
            sx={customStyles.footerButton}
            data-testid="back-to-home-button"
          >
            {t('common.backToHome', 'Back to Home')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            href="/?auth=open"
            sx={{ ...customStyles.footerButton, bgcolor: 'transparent' }}
            data-testid="back-to-login-button"
          >
            {t('auth.backToLogin', 'Back to Login')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          maxWidth: 'min(400px, 100vw - 32px)',
          mx: 'auto',
          mt: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Box
          tabIndex={-1}
          data-testid="reset-success-heading"
          sx={{
            backgroundColor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            border: `3px solid ${morkBorgColors.black}`,
            boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
            px: 1.25,
            py: 0.25,
            display: 'inline-block',
            mb: 2,
            transform: 'rotate(-0.3deg)',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {t('auth.resetSuccess', 'PASSWORD FORGED ANEW')}
          </Typography>
        </Box>
        <Typography
          sx={{
            mb: 3,
            color: morkBorgColors.white,
            fontFamily: "'Alegreya', serif",
            fontStyle: 'italic',
            fontSize: '0.95rem',
            opacity: 0.8,
          }}
        >
          {t('auth.resetSuccessDesc', 'Your password has been reset. You can now log in.')}
        </Typography>
        <Button
          variant="contained"
          fullWidth
          href="/"
          sx={customStyles.footerButton}
          data-testid="reset-success-back-button"
        >
          {t('common.backToHome', 'Back to Home')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 'min(400px, 100vw - 32px)',
        mx: 'auto',
        mt: 8,
        px: 2,
      }}
    >
      <Box
        component="h1"
        sx={{
          backgroundColor: morkBorgColors.yellow,
          color: morkBorgColors.black,
          border: `3px solid ${morkBorgColors.black}`,
          boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
          px: 1.25,
          py: 0.25,
          display: 'inline-block',
          mb: 3,
          transform: 'rotate(-0.6deg)',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.4rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {t('auth.resetPasswordTitle', 'RESET PASSWORD')}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label={t('auth.newPassword', 'New Password')}
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          required
          InputProps={{
            'aria-label': t('auth.newPassword', 'New Password'),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  aria-label={
                    showNewPassword
                      ? t('auth.hidePassword', 'Hide password')
                      : t('auth.showPassword', 'Show password')
                  }
                  sx={{ color: morkBorgColors.white }}
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          inputProps={{
            minLength: 8,
            'data-testid': 'new-password-input',
            'aria-describedby': 'new-password-helper',
          }}
          helperText={
            <Typography
              id="new-password-helper"
              sx={{
                color: morkBorgColors.white,
                fontFamily: "'Alegreya', serif",
                fontStyle: 'italic',
                fontSize: '0.85rem',
                opacity: 0.7,
              }}
            >
              {t('auth.passwordHint', 'Minimum 8 characters')}
            </Typography>
          }
          sx={customStyles.authModal.textField}
        />
        <TextField
          label={t('auth.confirmPassword', 'Confirm Password')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          InputProps={{
            'aria-label': t('auth.confirmPassword', 'Confirm Password'),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  aria-label={
                    showConfirmPassword
                      ? t('auth.hidePassword', 'Hide password')
                      : t('auth.showPassword', 'Show password')
                  }
                  sx={{ color: morkBorgColors.white }}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          inputProps={{
            minLength: 8,
            'data-testid': 'confirm-password-input',
          }}
          sx={customStyles.authModal.textFieldLast}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={resetPassword.isPending}
          data-testid="reset-password-submit"
          sx={{
            ...customStyles.footerButton,
            mt: 2,
            minHeight: 44,
            opacity: resetPassword.isPending ? 0.7 : 1,
          }}
          aria-busy={resetPassword.isPending}
        >
          {resetPassword.isPending ? (
            <CircularProgress size={24} sx={{ color: morkBorgColors.black }} />
          ) : (
            t('auth.resetPasswordButton', 'Reset Password')
          )}
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            ...customStyles.authErrorAlert,
            mt: 2,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
          role="status"
          aria-live="polite"
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
