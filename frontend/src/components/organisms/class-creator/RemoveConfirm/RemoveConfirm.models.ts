export type RemoveConfirmAction = { label: string; onClick: () => void; danger?: boolean };

export type RemoveConfirmProps = {
  /** Names what the removal would leave behind. */
  message: string;
  actions: RemoveConfirmAction[];
};
