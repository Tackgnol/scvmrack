import { createRpgToolsAuthClient } from "@tackgnol/rpgtools-shared-auth/client";

const client = createRpgToolsAuthClient();
const handoffId = new URLSearchParams(location.search).get("handoffId")!;
const approval = await client.inspectObrHandoff(handoffId);
const label = document.createElement("label");
label.textContent = "Code from the extension";
const code = document.createElement("input");
label.append(code);
const approve = document.createElement("button");
approve.textContent = "Approve sign-in";
const status = document.createElement("p");
status.setAttribute("role", "status");
approve.onclick = async () => {
  await client.approveObrHandoff(handoffId, code.value, approval.user!.id);
  status.textContent = "Approved";
};
document.body.append(label, approve, status);
