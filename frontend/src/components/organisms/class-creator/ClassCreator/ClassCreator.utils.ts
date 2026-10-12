import type { ClassDraft } from "@/api/classes";
import type { CreatorStep } from "../classCreator.models";

/** Whether a key event's target takes text (a text input, a textarea or editable content). */
export function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement && target.type === "text"))
  );
}

export const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** How many entries the step's reorderable list holds (0 on steps without one). */
export function reorderableCount(draft: ClassDraft, step: CreatorStep): number {
  if (step === "abilities") return draft.abilities.length;
  if (step === "origins") return draft.origins.length;
  if (step === "items") return draft.items.length;
  return 0;
}
