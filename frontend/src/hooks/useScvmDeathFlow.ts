import { useState } from 'react';
import {
  setSkipKillConfirm,
  shouldSkipKillConfirm,
} from '@/preferences/killConfirmation';

type PendingAction = 'generate' | 'kill' | null;

type Params = {
  generateNew: () => void;
  killAndReplace: () => void;
  isAuthenticated: boolean;
  prefersReducedMotion: boolean;
};

// Owns the "generate / kill & replace" flow and its death-stamp animation gate:
// the stamp plays first, then on animation end the actual generate/kill fires.
// Reduced motion skips the stamp and acts immediately. Also owns the kill-confirm
// dialog state (honouring the "don't ask again" preference).
export function useScvmDeathFlow({
  generateNew,
  killAndReplace,
  isAuthenticated,
  prefersReducedMotion,
}: Params) {
  const [killConfirmOpen, setKillConfirmOpen] = useState(false);
  const [killConfirmDontAskAgain, setKillConfirmDontAskAgain] = useState(false);
  const [stampDate, setStampDate] = useState<Date | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const triggerStamp = () => setStampDate(new Date());

  const handleNew = () => {
    if (prefersReducedMotion) {
      if (isAuthenticated) {
        generateNew();
      } else {
        killAndReplace();
      }
      return;
    }

    setPendingAction(isAuthenticated ? 'generate' : 'kill');
    triggerStamp();
  };

  const performKill = () => {
    if (prefersReducedMotion) {
      killAndReplace();
      return;
    }

    setPendingAction('kill');
    triggerStamp();
  };

  const handleKillRequest = () => {
    // Honour the user's "Don't show this again" choice — kill straight away.
    if (shouldSkipKillConfirm()) {
      performKill();
      return;
    }

    setKillConfirmDontAskAgain(false);
    setKillConfirmOpen(true);
  };

  const handleKillConfirm = () => {
    if (killConfirmDontAskAgain) {
      setSkipKillConfirm(true);
    }

    setKillConfirmOpen(false);
    performKill();
  };

  const onStampAnimationEnd = () => {
    setStampDate(null);

    if (pendingAction === 'generate') {
      generateNew();
    } else if (pendingAction === 'kill') {
      killAndReplace();
    }

    setPendingAction(null);
  };

  return {
    killConfirmOpen,
    setKillConfirmOpen,
    killConfirmDontAskAgain,
    setKillConfirmDontAskAgain,
    stampDate,
    handleNew,
    handleKillRequest,
    handleKillConfirm,
    onStampAnimationEnd,
  };
}
