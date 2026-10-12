import type { KeyboardEvent } from "react";

/**
 * Arrow/Home/End handling for a radio group of buttons: moves to the next enabled
 * radio, focuses it and returns its index; null when the key isn't one it handles.
 */
export function moveInRadioGroup(event: KeyboardEvent<HTMLElement>): number | null {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return null;
  }
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (step === undefined && event.key !== "Home" && event.key !== "End") {
    return null;
  }
  const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  const enabled = radios.filter((radio) => !radio.disabled);
  if (enabled.length === 0) {
    return null;
  }
  const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? enabled.length - 1
        : (Math.max(current, 0) + (step ?? 0) + enabled.length) % enabled.length;
  event.preventDefault();
  enabled[next].focus();
  return radios.indexOf(enabled[next]);
}
