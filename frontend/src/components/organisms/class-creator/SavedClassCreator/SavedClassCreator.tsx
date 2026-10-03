import { classKeys, getClass } from "@/api/classes";
import { CenterRow, Spinner } from "@/pages/gmPages.styles";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ClassCreator } from "../ClassCreator/ClassCreator";
import type { SavedClassCreatorProps } from "./SavedClassCreator.models";

/** Loads one of the GM's classes, then opens it in the creator. */
export function SavedClassCreator({ classId }: SavedClassCreatorProps) {
  const { t } = useTranslation();
  const classQuery = useQuery({ queryKey: classKeys.one(classId), queryFn: () => getClass(classId) });

  if (classQuery.error) {
    return <Alert severity="error">{getUserFacingApiErrorMessage(classQuery.error, t, "This class wouldn't load.")}</Alert>;
  }
  if (!classQuery.data) {
    return (
      <CenterRow>
        <Spinner />
      </CenterRow>
    );
  }
  return <ClassCreator key={classQuery.data.id} classId={classQuery.data.id} initialDraft={classQuery.data.draft} />;
}
