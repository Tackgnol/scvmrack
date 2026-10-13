import {
  classPoolKeys,
  getClassPool,
  setPoolClass,
  setPoolClassless,
  type ClassPoolView,
} from "@/api/classPool";
import { getApiLocale } from "@/hooks/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export type PoolSwitch =
  | { kind: "class"; lineageId: string; name: string; enabled: boolean }
  | { kind: "classless"; enabled: boolean };

/** Applies one switch to a pool view, as the server will once it saves. */
export function applyPoolSwitch(
  view: ClassPoolView,
  change: PoolSwitch,
): ClassPoolView {
  if (change.kind === "classless") {
    return { ...view, classlessEnabled: change.enabled };
  }
  return {
    ...view,
    classes: view.classes.map((c) =>
      c.lineageId === change.lineageId ? { ...c, enabled: change.enabled } : c,
    ),
    removed: change.enabled
      ? view.removed
      : view.removed.filter((r) => r.lineageId !== change.lineageId),
  };
}

export type PoolSwitchCallbacks = {
  onSaved: (change: PoolSwitch) => void;
  onFailed: (change: PoolSwitch) => void;
};

/**
 * The GM's Party Class Pool: the view plus a switch that saves at once, optimistically.
 * Switches save one at a time, in the order they were flipped.
 */
export function useClassPool(partyId: string, callbacks: PoolSwitchCallbacks) {
  const { i18n } = useTranslation();
  const locale = getApiLocale(i18n.language);
  const queryKey = classPoolKeys.pool(partyId, locale);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: () => getClassPool(partyId, locale),
  });

  const mutationKey = [...queryKey, "switch"];
  const mutation = useMutation({
    mutationKey,
    scope: { id: `class-pool-${partyId}` },
    mutationFn: (change: PoolSwitch) =>
      change.kind === "classless"
        ? setPoolClassless({ partyId, enabled: change.enabled, locale })
        : setPoolClass({
            partyId,
            lineageId: change.lineageId,
            enabled: change.enabled,
            locale,
          }),
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<ClassPoolView>(queryKey, (current) =>
        current ? applyPoolSwitch(current, change) : current,
      );
    },
    onError: (_error, change) => {
      // Undo only this switch; later ones are still queued. The refetch restores the rest.
      queryClient.setQueryData<ClassPoolView>(queryKey, (current) =>
        current
          ? applyPoolSwitch(current, { ...change, enabled: !change.enabled })
          : current,
      );
      void queryClient.invalidateQueries({ queryKey });
      callbacks.onFailed(change);
    },
    onSuccess: (view, change) => {
      // Switches still in flight aren't in this response yet; keep them showing.
      const pending = queryClient
        .getMutationCache()
        .findAll({ mutationKey, status: "pending" })
        .map((m) => m.state.variables as PoolSwitch)
        .filter((v) => v !== change);
      queryClient.setQueryData(queryKey, pending.reduce(applyPoolSwitch, view));
      callbacks.onSaved(change);
    },
  });

  return { query, mutation };
}
