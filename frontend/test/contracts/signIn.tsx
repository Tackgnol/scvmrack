import { createRoot } from "react-dom/client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../browser/BrowserTestProvider";
import { useObrSession } from "@/obr/useObrSession";

export function SignInContract() {
  const { user, signIn, signInProgress } = useObrSession();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <div data-testid="receiving-user">{user?.id}</div>
      <div data-testid="comparison-code">{signInProgress?.code}</div>
      <button
        onClick={() => {
          void signIn().catch((cause) => setError(String(cause)));
        }}
      >
        Start sign-in
      </button>
      {error && <div role="alert">{error}</div>}
    </>
  );
}
const host = document.createElement("div");
host.id = "signin-contract";
document.body.replaceChildren(host);
createRoot(host).render(
  <BrowserTestProvider>
    <QueryClientProvider client={new QueryClient()}>
      <SignInContract />
    </QueryClientProvider>
  </BrowserTestProvider>,
);
