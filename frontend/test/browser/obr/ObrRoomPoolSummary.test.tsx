import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BrowserTestProvider from "../BrowserTestProvider";
import { ObrRoomPoolSummary } from "@/components/obr/ObrRoomPoolSummary/ObrRoomPoolSummary";
import { fetchClasses } from "@/api/draft";

vi.mock("@/api/draft", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/draft")>()),
  fetchClasses: vi.fn(),
}));

describe("ObrRoomPoolSummary", () => {
  it("lists the room party's classes read-only for someone who doesn't own it", async () => {
    vi.mocked(fetchClasses).mockResolvedValue([
      { id: 1, name: "Fanged Deserter", description: null },
      { id: 2, name: "Gutterborn Scum", description: null },
    ] as Awaited<ReturnType<typeof fetchClasses>>);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserTestProvider>
          <ObrRoomPoolSummary roomId="room-1" />
        </BrowserTestProvider>
      </QueryClientProvider>,
    );

    await expect
      .element(page.getByText("Classes this room rolls: Fanged Deserter, Gutterborn Scum. Only the party's owner can change them."))
      .toBeVisible();
    await expect.poll(() => vi.mocked(fetchClasses).mock.calls[0]?.[3]).toBe("room-1");
  });
});
