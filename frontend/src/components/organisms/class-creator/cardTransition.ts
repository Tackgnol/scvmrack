import { flushSync } from "react-dom";

type TypedViewTransition = { skipTransition: () => void; finished: Promise<void> };
type StartTyped = (options: { update: () => void; types: string[] }) => TypedViewTransition;

let running: TypedViewTransition | null = null;

/**
 * Opens or closes a creator card as a View Transition (see global.css). Without
 * typed view transitions, or with reduced motion, the change is instant.
 *
 * Chrome hit-tests only the transition's pseudo-elements while one runs, so a
 * click mid-animation would be lost: a press during it finishes the running one
 * at once and replays the click on whatever is under the pointer.
 */
export function withCardTransition(closing: boolean, update: () => void, afterUpdate: () => void): void {
  const start = (document as unknown as { startViewTransition?: StartTyped }).startViewTransition;
  const typed = typeof ViewTransition !== "undefined" && "types" in ViewTransition.prototype;
  if (!start || !typed || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    update();
    afterUpdate();
    return;
  }
  running?.skipTransition();
  const transition = start.call(document, {
    update: () => {
      flushSync(update);
      afterUpdate();
    },
    types: [closing ? "card-close" : "card-open"],
  });
  running = transition;
  const replay = (event: PointerEvent) => {
    event.preventDefault();
    transition.skipTransition();
    void transition.finished.then(() => {
      (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.click();
    });
  };
  document.addEventListener("pointerdown", replay, { capture: true, once: true });
  void transition.finished.finally(() => {
    document.removeEventListener("pointerdown", replay, { capture: true });
    if (running === transition) running = null;
  });
}
