export type ObrSceneCleanupProps = {
  message: string | null;
  pending: boolean;
  onRetry: () => Promise<void>;
};
