import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SmallAction } from "../classCreator.styles";
import type { RemoveConfirmProps } from "./RemoveConfirm.models";
import { Actions, Confirm } from "./RemoveConfirm.styles";

/** An inline question before a removal that would leave something behind; it takes focus when it opens. */
export function RemoveConfirm({ message, actions }: RemoveConfirmProps) {
  const { t } = useTranslation();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <Confirm role="group" aria-label={t("creator.confirmRemoval", "Confirm removal")}>
      <p>{message}</p>
      <Actions>
        {actions.map((action, i) => (
          <SmallAction
            key={action.label}
            ref={i === 0 ? first : undefined}
            type="button"
            className={action.danger ? "danger" : undefined}
            onClick={action.onClick}
          >
            {action.label}
          </SmallAction>
        ))}
      </Actions>
    </Confirm>
  );
}
