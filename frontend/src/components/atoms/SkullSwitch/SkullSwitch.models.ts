export type SkullSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Fanged Deserter in the pool". */
  label: string;
  /** Id of an element describing what the switch controls. */
  describedBy?: string;
  /** Shown but not switchable: a dashed track, no marks. */
  locked?: boolean;
};

export type SkullSwitchFlip = "on" | "off" | null;
