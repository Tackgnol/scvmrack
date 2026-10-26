import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../browser/BrowserTestProvider";
import { ObrPartyRoster } from "@/components/obr/ObrPartyRoster";

const host = document.createElement("div");
host.id = "contract-root";
document.body.replaceChildren(host);
createRoot(host).render(
  <BrowserTestProvider>
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ObrPartyRoster />
    </QueryClientProvider>
  </BrowserTestProvider>,
);
