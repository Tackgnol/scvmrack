import { createRoot } from "react-dom/client";
import BrowserTestProvider from "../browser/BrowserTestProvider";
import { ObrOpenInScvmrackButton } from "@/components/obr/ObrOpenInScvmrackButton";

const characterId = new URLSearchParams(window.location.search).get(
  "contractCharacter",
);
if (!characterId) {
  throw new Error("Contract character is required");
}
const host = document.createElement("div");
host.id = "transfer-contract";
document.body.replaceChildren(host);
createRoot(host).render(
  <BrowserTestProvider>
    <ObrOpenInScvmrackButton characterId={characterId} />
  </BrowserTestProvider>,
);
