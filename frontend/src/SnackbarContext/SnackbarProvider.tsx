import { createContext, use, useState, type ReactNode } from "react";
import { Snackbar, Alert, AlertColor, Button } from "@mui/material";
import { customStyles } from "@/theme/morkBorgTheme";

// ============================================
// Types
// ============================================
interface SnackbarAction {
    label: string;
    onClick: () => void;
}

interface SnackbarMessage {
    id: string;
    message: string;
    severity: AlertColor;
    action?: SnackbarAction;
    autoHideDuration?: number | null;
}

interface SnackbarContextType {
    showSnackbar: (
        message: string,
        severity?: AlertColor,
        options?: {
            action?: SnackbarAction;
            autoHideDuration?: number | null;
        }
    ) => void;
    showError: (message: string, action?: SnackbarAction) => void;
    showSuccess: (message: string) => void;
    showInfo: (message: string) => void;
    hideSnackbar: () => void;
}

// ============================================
// Context
// ============================================
const SnackbarContext = createContext<SnackbarContextType | null>(null);

// ============================================
// Provider
// ============================================
interface SnackbarProviderProps {
    children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
    const [current, setCurrent] = useState<SnackbarMessage | null>(null);
    const [open, setOpen] = useState(false);

    const showSnackbar = (
        message: string,
        severity: AlertColor = "info",
        options?: {
            action?: SnackbarAction;
            autoHideDuration?: number | null;
        }
    ) => {
        setCurrent({
            id: Date.now().toString(),
            message,
            severity,
            action: options?.action,
            autoHideDuration: options?.autoHideDuration ?? 4000,
        });
        setOpen(true);
    };

    const hideSnackbar = () => {
        setOpen(false);
    };

    const showError = (message: string, action?: SnackbarAction) => {
        showSnackbar(message, "error", { action, autoHideDuration: action ? null : 6000 });
    };

    const showSuccess = (message: string) => {
        showSnackbar(message, "success", { autoHideDuration: 2000 });
    };

    const showInfo = (message: string) => {
        showSnackbar(message, "info");
    };

    const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <SnackbarContext.Provider
            value={{
                showSnackbar,
                showError,
                showSuccess,
                showInfo,
                hideSnackbar,
            }}
        >
            {children}
            <Snackbar
                open={open}
                autoHideDuration={current?.autoHideDuration}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleClose}
                    severity={current?.severity ?? "info"}
                    variant="filled"
                    sx={customStyles.snackbarAlert}
                    action={
                        current?.action && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => {
                                    current.action?.onClick();
                                    handleClose();
                                }}
                            >
                                {current.action.label}
                            </Button>
                        )
                    }
                >
                    {current?.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
}

// ============================================
// Hook
// ============================================
export function useSnackbar(): SnackbarContextType {
    const context = use(SnackbarContext);
    if (!context) {
        throw new Error("useSnackbar must be used within a SnackbarProvider");
    }
    return context;
}
