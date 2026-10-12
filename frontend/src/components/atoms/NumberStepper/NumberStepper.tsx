import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signed } from "@/utils/signed";
import type { NumberStepperProps } from "./NumberStepper.models";
import { Field, Hint, Label } from "../field.styles";
import { Row, Stamp, StepButton } from "./NumberStepper.styles";
import { clamp } from "@/utils/clamp";
import { parseStepperText } from "./NumberStepper.utils";

/** A − value + stepper whose value is a typeable yellow stamp; arrow keys nudge it. */
export function NumberStepper({
  id,
  label,
  value,
  min,
  max,
  onChange,
  signedValue = false,
  hint,
  commitOnEnterOnly = false,
}: NumberStepperProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState<string | null>(null);
  const shown = signedValue ? signed(value) : String(value);
  const set = (next: number, kind: "nudge" | "typing" = "typing") => {
    const bounded = clamp(next, min, max);
    if (bounded === value) {
      return;
    }
    document.body.dataset.creatorHistorySource = id;
    document.body.dataset.creatorHistoryKind = kind;
    onChange(bounded);
    delete document.body.dataset.creatorHistorySource;
    delete document.body.dataset.creatorHistoryKind;
  };
  const commit = () => {
    if (typed !== null) {
      const parsed = parseStepperText(typed);
      if (parsed !== null) {
        set(parsed, "typing");
      }
      setTyped(null);
    }
  };
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Row>
        <StepButton
          type="button"
          tabIndex={-1}
          aria-label={t("creator.stepper.decrease", "Decrease {{label}}", {
            label,
          })}
          disabled={value <= min}
          onClick={() => set(value - 1, "nudge")}
        >
          <RemoveIcon aria-hidden="true" />
        </StepButton>
        <Stamp
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-describedby={hintId}
          value={typed ?? shown}
          onChange={(event) => setTyped(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (
              !commitOnEnterOnly &&
              (event.key === "ArrowUp" || event.key === "ArrowDown")
            ) {
              event.preventDefault();
              setTyped(null);
              set(value + (event.key === "ArrowUp" ? 1 : -1), "nudge");
            } else if (event.key === "Enter") {
              commit();
            }
          }}
        />
        <StepButton
          type="button"
          tabIndex={-1}
          aria-label={t("creator.stepper.increase", "Increase {{label}}", {
            label,
          })}
          disabled={value >= max}
          onClick={() => set(value + 1, "nudge")}
        >
          <AddIcon aria-hidden="true" />
        </StepButton>
      </Row>
      {hint && <Hint id={hintId}>{hint}</Hint>}
    </Field>
  );
}
