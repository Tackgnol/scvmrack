import { obrAuthClient } from "@/auth/obrAuthClient";

// Fault injection at the external opener message boundary; session issuance/redeem/revocation stay real.
const button = document.createElement("button");
button.textContent = "Send mismatched identity";
button.onclick = () => {
  const nonce = crypto.randomUUID();
  const character = new URLSearchParams(location.search).get(
    "contractCharacter",
  );
  const tab = window.open(
    `/obr-open?character=${character}&obrTransfer=${nonce}`,
    "_blank",
  );
  let issuing = false;
  const ready = async (event: MessageEvent) => {
    if (
      issuing ||
      event.source !== tab ||
      event.origin !== location.origin ||
      event.data?.nonce !== nonce ||
      event.data?.type !== "rpgtools:obr-tab-ready"
    ) {
      return;
    }
    issuing = true;
    const issued = await obrAuthClient.issueObrExchangeToken(
      event.data.recipientSecret,
    );
    tab?.postMessage(
      {
        type: "rpgtools:obr-tab-transfer",
        nonce,
        ...issued,
        user: { id: "wrong-expected-identity", name: "Mismatched identity" },
      },
      location.origin,
    );
    window.removeEventListener("message", ready);
  };
  window.addEventListener("message", ready);
};
document.body.replaceChildren(button);
