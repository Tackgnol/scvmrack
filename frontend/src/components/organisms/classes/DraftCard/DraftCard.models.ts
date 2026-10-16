import type { ApiLocale } from "@/api";
import type { StoredClassDraft } from "@/api/classes";

export type DraftCardProps = {
  draft: StoredClassDraft;
  locale: ApiLocale;
  /** The draft's class is archived or taken down, so it can only be discarded. */
  locked: boolean;
  onDiscard: (name: string) => void;
};
