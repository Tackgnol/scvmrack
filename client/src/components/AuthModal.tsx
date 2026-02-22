import { useAuth } from "@/hooks/useAuth.ts";
import { useState, useEffect, useCallback } from "react";
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import { useCurrentCharacter } from "@/hooks/useCurrentCharacter";
import { morkBorgColors, customStyles } from "@theme/morkBorgTheme";
import { TurnstileWidget } from "./TurnstileWidget";

const PENDING_CLAIM_KEY = "pending-claim-character-id";

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
}

type TabValue = "login" | "signup";

export function AuthModal({ open, onClose }: AuthModalProps) {
    const { t } = useTranslation();
    const {
        user,
        isAuthenticated,
        isGuest,
        signIn,
        signUp,
        signOut,
        signInMagicLink
    } = useAuth();

    const { character, claimCharacter, isClaiming, characterId } = useCurrentCharacter();

    const [tab, setTab] = useState<TabValue>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showClaimPrompt, setShowClaimPrompt] = useState(false);
    const [showVerifyEmail, setShowVerifyEmail] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
    const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    const turnstileEnabled = Boolean(turnstileSiteKey);

    const resetTurnstile = useCallback(() => {
        setTurnstileToken(null);
        setTurnstileResetSignal((prev) => prev + 1);
    }, []);

    const onTurnstileTokenChange = useCallback((token: string | null) => {
        setTurnstileToken(token);
    }, []);

    const ensureTurnstileToken = useCallback(() => {
        if (!turnstileEnabled) {
            return true;
        }

        if (!turnstileToken) {
            setError("Please verify that you are human.");
            return false;
        }

        return true;
    }, [turnstileEnabled, turnstileToken]);

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
            setEmail("");
            setPassword("");
            setName("");
            setError(null);
            setShowVerifyEmail(false);
            setTab("login");
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
            await signIn.mutateAsync({ email, password, turnstileToken: turnstileToken ?? undefined });

            // If user was guest with a character, offer to claim it
            if (isGuest && character) {
                setShowClaimPrompt(true);
            } else {
                onClose();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.loginFailed"));
        } finally {
            if (turnstileEnabled) {
                resetTurnstile();
            }
        }
    };

    const handleMagicLinkRequest = async () => {
        if (!email) {
            setError(t("auth.emailRequired", "Email is required for magic links"));
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
            await signInMagicLink.mutateAsync({ email, turnstileToken: turnstileToken ?? undefined });
            setMagicLinkSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.magicLinkFailed"));
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

            await signUp.mutateAsync({ email, password, name, turnstileToken: turnstileToken ?? undefined });

            // Show "check your email" instead of claim prompt
            setShowVerifyEmail(true);
        } catch (err) {
            // Clear pending claim on error
            localStorage.removeItem(PENDING_CLAIM_KEY);
            setError(err instanceof Error ? err.message : t("auth.signupFailed"));
        } finally {
            if (turnstileEnabled) {
                resetTurnstile();
            }
        }
    };

    const handleClaim = async (shouldClaim: boolean) => {
        if (shouldClaim) {
            try {
                await claimCharacter();
            } catch (err) {
                setError(err instanceof Error ? err.message : t("auth.claimFailed"));
                return;
            }
        }
        // Clear pending claim
        localStorage.removeItem(PENDING_CLAIM_KEY);
        setShowClaimPrompt(false);
        onClose();
    };

    const handleLogout = async () => {
        await signOut.mutateAsync();
    };

    const modalStyle = {
        ...customStyles.modal.paper,
        width: { xs: "90%", sm: 400 },
        border: `2px solid ${morkBorgColors.pink}`,
        boxShadow: 24,
        p: 4,
    };


    if (showClaimPrompt) {
        const charName = character?.name || "your character";

        return (
            <Modal open={open} onClose={() => {}}>
                <Box sx={modalStyle}>
                    <Typography variant="h5" sx={customStyles.authModal.title}>
                        {t("auth.claimTitle")}
                    </Typography>
                    <Typography sx={customStyles.authModal.titleMarginLarge}>
                        {t("auth.claimPrompt", { characterName: charName })}
                    </Typography>
                    <Box sx={customStyles.authModal.buttonGap}>
                        <Button
                            variant="contained"
                            onClick={() => handleClaim(true)}
                            disabled={isClaiming}
                            fullWidth
                        >
                            {isClaiming ? <CircularProgress size={24} /> : t("auth.claimYes")}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => handleClaim(false)}
                            disabled={isClaiming}
                            fullWidth
                        >
                            {t("auth.claimNo")}
                        </Button>
                    </Box>
                    {error && <Alert severity="error" sx={customStyles.authErrorAlert}>{error}</Alert>}
                </Box>
            </Modal>
        );
    }

    // --- VIEW: VERIFY EMAIL (after signup) ---
    if (showVerifyEmail) {
        return (
            <Modal open={open} onClose={onClose}>
                <Box sx={modalStyle}>
                    <IconButton onClick={onClose} sx={customStyles.authModal.closeButton}>
                        <CloseIcon />
                    </IconButton>

                    <Typography variant="h5" sx={customStyles.authModal.titleCenter}>
                        {t("auth.verifyEmailTitle", "CHECK YOUR SCROLL")}
                    </Typography>
                    <Typography sx={customStyles.authModal.textCenter}>
                        {t("auth.verifyEmailDesc", "We've sent a verification link to your email. Click it to complete your registration.")}
                    </Typography>
                    {isGuest && character && (
                        <Alert severity="info" sx={customStyles.authModal.infoAlert}>
                            {t("auth.characterWillBeSaved", {
                                characterName: character.name || "Your character",
                                defaultValue: "{{characterName}} will be saved to your account after verification.",
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
                        {t("common.close", "Close")}
                    </Button>
                </Box>
            </Modal>
        );
    }

    // --- VIEW: AUTHENTICATED PROFILE ---
    if (isAuthenticated) {
        return (
            <Modal open={open} onClose={onClose}>
                <Box sx={modalStyle}>
                    <IconButton onClick={onClose} sx={customStyles.authModal.closeButton}>
                        <CloseIcon />
                    </IconButton>

                    <Typography variant="h5" sx={customStyles.authModal.title}>
                        {t("auth.profile")}
                    </Typography>
                    <Typography sx={customStyles.authModal.titleMargin}>
                        <strong>{t("auth.name")}:</strong> {user?.name}
                    </Typography>
                    <Typography sx={customStyles.authModal.titleMargin}>
                        <strong>{t("auth.email")}:</strong> {user?.email}
                    </Typography>
                    <Typography sx={customStyles.authModal.titleMarginLarge}>
                        <strong>{t("auth.verified")}:</strong> {user?.emailVerified ? "✓" : "✗"}
                    </Typography>

                    {!user?.emailVerified && (
                        <Alert severity="warning" sx={customStyles.authModal.warningAlert}>
                            {t("auth.emailNotVerified", "Your email is not verified. Check your inbox for a verification link.")}
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
                        {signOut.isPending ? <CircularProgress size={24} /> : t("auth.logout")}
                    </Button>
                </Box>
            </Modal>
        );
    }

    // --- VIEW: LOGIN / SIGNUP TABS ---
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <IconButton onClick={onClose} sx={customStyles.authModal.closeButton}>
                    <CloseIcon />
                </IconButton>

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
                    <Tab value="login" label={t("auth.login")} />
                    <Tab value="signup" label={t("auth.signup")} />
                </Tabs>

                {tab === "login" && (
                    <Box>
                        {magicLinkSent ? (
                            <Box sx={customStyles.authModal.centeredBox}>
                                <Typography variant="h6" sx={customStyles.authModal.title}>
                                    {t("auth.checkEmailTitle", "SOULS DISPATCHED")}
                                </Typography>
                                <Typography sx={customStyles.authModal.titleMarginLarge}>
                                    {t("auth.checkEmailDesc", "A magic link has been sent to your scroll (email).")}
                                </Typography>
                                <Button variant="outlined" fullWidth onClick={() => setMagicLinkSent(false)}>
                                    {t("auth.tryAgain", "Back to Login")}
                                </Button>
                            </Box>
                        ) : (
                            <Box component="form" onSubmit={handleLogin}>
                                <TextField
                                    label={t("auth.email")}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    fullWidth
                                    required
                                    sx={customStyles.authModal.textField}
                                />
                                <TextField
                                    label={t("auth.password")}
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
                                    disabled={signIn.isPending}
                                >
                                    {signIn.isPending ? <CircularProgress size={24} /> : t("auth.login")}
                                </Button>

                                <Divider sx={customStyles.authModal.divider}>
                                    <Typography variant="caption" sx={customStyles.authDividerText}>
                                        {t("auth.or", "OR")}
                                    </Typography>
                                </Divider>

                                <Button
                                    variant="text"
                                    fullWidth
                                    onClick={handleMagicLinkRequest}
                                    disabled={signInMagicLink.isPending}
                                    sx={customStyles.authModal.magicLinkButton}
                                >
                                    {signInMagicLink.isPending ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        t("auth.sendMagicLink", "Email me a Magic Link")
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {tab === "signup" && (
                    <Box component="form" onSubmit={handleSignup}>
                        <TextField
                            label={t("auth.name")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            sx={customStyles.authModal.textField}
                        />
                        <TextField
                            label={t("auth.email")}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                            sx={customStyles.authModal.textField}
                        />
                        <TextField
                            label={t("auth.password")}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                            inputProps={{ minLength: 8 }}
                            helperText={t("auth.passwordHint")}
                            sx={customStyles.authModal.textFieldLast}
                        />
                        {isGuest && character && (
                            <Alert severity="info" sx={customStyles.authModal.infoAlert}>
                                {t("auth.guestCharacterNotice", {
                                    characterName: character.name || "Your character",
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
                            disabled={signUp.isPending}
                        >
                            {signUp.isPending ? <CircularProgress size={24} /> : t("auth.signup")}
                        </Button>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={customStyles.authModal.errorAlert}>
                        {error}
                    </Alert>
                )}
            </Box>
        </Modal>
    );
}
