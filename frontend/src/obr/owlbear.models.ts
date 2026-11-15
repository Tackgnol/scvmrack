export type ObrRole = "GM" | "PLAYER";

export type ObrNotificationVariant = "SUCCESS" | "WARNING" | "ERROR";

export type Unsubscribe = () => void;

/**
 * The parts of Owlbear Rodeo the app talks to. `sdkOwlbear` is the real host;
 * tests pass an in-memory one through `OwlbearContext`.
 */
export type Owlbear = {
  /** False when the page is not embedded in Owlbear Rodeo. */
  readonly isAvailable: boolean;
  /**
   * Runs `start` once Owlbear is ready, unless the returned stop ran first.
   * Stop also runs whatever `start` returned; `isActive` turns false on stop.
   */
  whenReady(start: (isActive: () => boolean) => Unsubscribe | void): Unsubscribe;
  /** The room this iframe belongs to; readable before Owlbear is ready. */
  roomId(): string;
  playerId(): Promise<string>;
  role(): Promise<ObrRole>;
  /** Reports the player's role once Owlbear is ready, then on every change. */
  watchRole(listener: (role: ObrRole) => void): Unsubscribe;
  /** Replaces the player's token selection on the map. */
  selectTokens(tokenIds: string[]): Promise<void>;
  notify(message: string, variant: ObrNotificationVariant): Promise<void>;
  setPanelWidth(width: number): Promise<void>;
  setPanelHeight(height: number): Promise<void>;
  closePopover(popoverId: string): Promise<void>;
  onBroadcast(channel: string, listener: (data: unknown) => void): Unsubscribe;
};
