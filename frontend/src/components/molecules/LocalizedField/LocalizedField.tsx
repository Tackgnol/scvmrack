import { Label } from "@/components/atoms/field.styles";
import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";
import type { LocalizedFieldProps } from "./LocalizedField.models";
import { Count, Head, Input, Missing, TextArea } from "./LocalizedField.styles";

/** One language of a translated text field, marked invalid when that language is missing. */
export function LocalizedField({
  id,
  label,
  value,
  language,
  multiline = false,
  showMissing,
  maxLength,
  onChange,
  onBlur,
  action,
  onPaste,
  required = false,
}: LocalizedFieldProps) {
  const { t } = useTranslation();
  const missing = showMissing && value.trim() === "";
  const nearLimit = value.length > maxLength * 0.8;
  const describedBy = [missing && `${id}-missing`, nearLimit && `${id}-count`]
    .filter(Boolean)
    .join(" ");
  const common = {
    id,
    value,
    maxLength,
    "aria-invalid": missing,
    "aria-required": required || undefined,
    "aria-describedby": describedBy || undefined,
    onKeyDown: (
      event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (event.key === "Escape") {
        event.currentTarget.blur();
      }
    },
    onPaste,
    onBlur,
  };

  return (
    <div>
      <Head>
        <Label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
        {action}
      </Head>
      {multiline ? (
        <TextArea
          {...common}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          type="text"
          {...common}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {missing && (
        <Missing id={`${id}-missing`}>
          {t(`creator.missingText.${language}`, "Text missing")}
        </Missing>
      )}
      {nearLimit && (
        <Count
          id={`${id}-count`}
          className={value.length >= maxLength ? "over" : undefined}
        >
          {t("creator.charCount", "{{count}} of {{max}} characters", {
            count: value.length,
            max: maxLength,
          })}
        </Count>
      )}
    </div>
  );
}
