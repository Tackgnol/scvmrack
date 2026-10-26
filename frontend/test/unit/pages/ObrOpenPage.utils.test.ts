import { expect, it } from "vitest";
import { obrOpenDestination } from "@/pages/ObrOpenPage.utils";

it.each([
  [
    "?character=822cdfa1-1d09-4504-94e7-1d5bb2efcb11",
    "/character/822cdfa1-1d09-4504-94e7-1d5bb2efcb11",
  ],
  ["?to=class&classId=12", "/classes/12"],
  [
    "?to=forge&obrRoom=room%26other&obrPlayer=player",
    "/character/create?obrRoom=room%26other&obrPlayer=player",
  ],
  ["", null],
  ["?character=------------------------------------", null],
  ["?character=https://untrusted.example/", null],
  ["?to=class&classId=0", null],
  ["?to=class&classId=12/other", null],
  ["?to=forge&obrRoom=%20&obrPlayer=player", null],
  ["?to=unknown&character=822cdfa1-1d09-4504-94e7-1d5bb2efcb11", null],
])("validates receiving destination %s", (search, expected) => {
  expect(obrOpenDestination(search)).toBe(expected);
});
