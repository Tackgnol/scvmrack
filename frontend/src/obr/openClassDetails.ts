import { openObrSessionTab } from "@/auth/obrAuthClient";

export function openClassDetails(
  classId: number): Promise<void> {
  return openObrSessionTab(
    `/obr-open?to=class&classId=${encodeURIComponent(classId)}`,
  );
}
