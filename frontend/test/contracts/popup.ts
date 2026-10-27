import {
  createRpgToolsAuthClient,
  signInViaObrPopup,
} from "@tackgnol/rpgtools-shared-auth/client";

const apiOrigin = new URLSearchParams(location.search).get("api");
if (!apiOrigin || new URL(apiOrigin).hostname !== "127.0.0.1") {
  throw new Error("A local protocol API is required");
}
let token = "";
const guest = await fetch(apiOrigin + "/api/auth/sign-in/anonymous", {
  method: "POST",
  credentials: "omit",
  headers: { "content-type": "application/json" },
  body: "{}",
});
if (!guest.ok) {
  throw new Error("Guest fixture sign-in failed");
}
token = guest.headers.get("set-auth-token") ?? "";
const guestId = ((await guest.json()) as { user: { id: string } }).user.id;
const client = createRpgToolsAuthClient({
  apiBase: apiOrigin + "/api",
  baseHeaders: () => ({ authorization: "Bearer " + token }),
  onSessionToken: (next) => {
    token = next;
  },
});
// The external identity provider is replaced; the handoff HTTP protocol is real.
client.getLoginUrl = (returnTo) => {
  const handoffId = new URL(returnTo!, location.origin).searchParams.get(
    "handoffId",
  )!;
  return `${apiOrigin}/approval-fixture?handoffId=${encodeURIComponent(handoffId)}`;
};
const status = document.createElement("p");
status.setAttribute("role", "status");
status.dataset.guestId = guestId;
const cancel = document.createElement("button");
cancel.textContent = "Cancel sign-in";
cancel.disabled = true;
const start = document.createElement("button");
start.textContent = "Sign in";
let attempt: AbortController | undefined;
const abortDuring = new URLSearchParams(location.search).get("abortDuring");
const redeem = client.redeemObrHandoff;
client.redeemObrHandoff = async (...args) => {
  const result = await redeem(...args);
  if (abortDuring === "redemption") {
    attempt?.abort();
  }
  return result;
};
const getSession = client.getSession;
client.getSession = async (...args) => {
  const result = await getSession(...args);
  if (abortDuring === "confirmation") {
    attempt?.abort();
  }
  return result;
};
cancel.onclick = () => attempt?.abort();
start.onclick = async () => {
  attempt = new AbortController();
  start.disabled = true;
  cancel.disabled = false;
  try {
    await signInViaObrPopup(client, {
      signal: attempt.signal,
      onProgress: (progress) => {
        cancel.disabled = progress.state === "redeeming";
        status.textContent = progress.code ?? progress.state;
      },
    });
    const session = await client.getSession();
    status.textContent = `Signed in as ${session.user?.id}`;
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : "Sign-in failed";
  } finally {
    cancel.disabled = true;
    start.disabled = false;
  }
};
document.body.append(start, cancel, status);
