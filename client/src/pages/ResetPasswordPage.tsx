import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { customStyles } from '@theme/morkBorgTheme';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Better Auth puts the token in the URL search params
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

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
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2 }}>
        <Alert severity="error">
          {t('auth.invalidResetLink', 'Invalid or expired reset link.')}
        </Alert>
        <Button
          variant="outlined"
          fullWidth
          href="/"
          sx={{ mt: 2 }}
        >
          {t('common.backToHome', 'Back to Home')}
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          {t('auth.resetSuccess', 'PASSWORD FORGED ANEW')}
        </Typography>
        <Typography sx={{ mb: 3 }}>
          {t('auth.resetSuccessDesc', 'Your password has been reset. You can now log in.')}
        </Typography>
        <Button variant="contained" fullWidth href="/">
          {t('common.backToHome', 'Back to Home')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        {t('auth.resetPasswordTitle', 'RESET PASSWORD')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label={t('auth.newPassword', 'New Password')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          required
          slotProps={{ htmlInput: { minLength: 8, 'data-testid': 'new-password-input' } as any }}
          helperText={t('auth.passwordHint', 'Minimum 8 characters')}
          sx={customStyles.authModal.textField}
        />
        <TextField
          label={t('auth.confirmPassword', 'Confirm Password')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          slotProps={{ htmlInput: { minLength: 8, 'data-testid': 'confirm-password-input' } as any }}
          sx={customStyles.authModal.textFieldLast}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={resetPassword.isPending}
          data-testid="reset-password-submit"
        >
          {resetPassword.isPending ? (
            <CircularProgress size={24} />
          ) : (
            t('auth.resetPasswordButton', 'Reset Password')
          )}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
