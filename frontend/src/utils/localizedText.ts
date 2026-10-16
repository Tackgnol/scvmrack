import type { Localized } from "@/api/classes";

/** The text in `language`, else in the first other language that has any; empty when none does. */
export function localizedText(value: Localized, language: keyof Localized): string {
  return value[language].trim() || Object.values(value).find((text) => text.trim())?.trim() || "";
}
