import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, expect, it, vi } from "vitest";
import { ObrGmView } from "@/components/obr/ObrGmView";
import { appHistory } from "@/router/history";
import { authKeys, resetRedirectControl } from "@/api";
import { partyKeys, type PartyDetail } from "@/api/party";
import { fetchSession } from "@/auth";
import { signInViaObrPopup } from "@tackgnol/rpgtools-shared-auth/client";
import BrowserTestProvider from "../BrowserTestProvider";
import { Body, Container, Bar } from "@/ObrLayout.styles";
import i18n, { loadLanguage } from "@/i18n";

const transport = vi.hoisted(() => {
  const fetch = vi.fn();
  const original = globalThis.fetch;
  const proxy: typeof globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes("/api/") ? fetch(input, init) : original(input, init);
  };
  vi.stubGlobal("fetch", proxy);
  return { fetch, proxy };
});

vi.mock("@/auth", async (original) => ({
  ...(await original<typeof import("@/auth")>()),
  fetchSession: vi.fn(),
}));
vi.mock("@tackgnol/rpgtools-shared-auth/client", async (original) => ({
  ...(await original<typeof import("@tackgnol/rpgtools-shared-auth/client")>()),
  signInViaObrPopup: vi.fn(),
}));
vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    isAvailable: true,
    onReady: (ready: () => void) => ready(),
    room: { id: "gm-room" },
    party: { getPlayers: async () => [], onChange: () => () => {} },
    player: {
      getId: async () => "gm",
      getRole: async () => "GM",
      getName: async () => "GM",
      getConnectionId: async () => "gm-connection",
      getSelection: async () => [],
    },
    scene: {
      isReady: async () => false,
      onReadyChange: () => () => {},
      items: { getItems: async () => [], onChange: () => () => {} },
    },
    broadcast: { onMessage: () => () => {}, sendMessage: async () => {} },
  },
  buildLabel: vi.fn(),
}));

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1280, 720);
  await i18n.changeLanguage("en");
});

it.each(["en", "pl"])(
  "recovers the compact GM panel with pointer controls in %s",
  async (locale) => {
    const initial = "expired";
    await page.viewport(420, 600);
    await loadLanguage(locale);
    await i18n.changeLanguage(locale);
    resetRedirectControl();
    appHistory.replace(
      `/obr.html?obrref=qa-room${initial === "expired" ? "&expired=true" : ""}#party`,
    );
    const session = {
      session: {},
      user: { id: "gm-owner", isAnonymous: false },
    };
    const party: PartyDetail = {
      id: "qa-party",
      name: "QA party",
      role: "gm",
      members: [],
      memberCount: 0,
      maxMembers: 10,
      createdAt: "",
      updatedAt: "",
    };
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    client.setQueryData(
      authKeys.session(),
      initial === "expired"
        ? session
        : { ...session, user: { id: "gm-guest", isAnonymous: true } },
    );
    client.setQueryData(partyKeys.obrRoom("gm-room"), party);
    vi.mocked(fetchSession).mockResolvedValue(session);
    let signedIn = false;
    vi.stubGlobal("fetch", transport.proxy);
    transport.fetch.mockImplementation(async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const path = new URL(request.url).pathname;
      if (path.endsWith("/csrf-token")) {
        return Response.json({ token: "qa-csrf" });
      }
      if (path.endsWith("/parties/promote")) {
        return Response.json({
          ...party,
          ...(signedIn ? { invitePath: "/join/qa-invite" } : {}),
        });
      }
      if (path.endsWith("/bindings")) {
        return Response.json({ roomId: "gm-room", players: [], tokens: [] });
      }
      if (path.endsWith("/participation")) {
        return Response.json({
          partyId: party.id,
          canManage: signedIn,
          memberIds: [],
          players: [],
          tokens: [],
          cleanup: [],
        });
      }
      if (path.endsWith("/limits")) {
        return Response.json({ maxMembers: 10 });
      }
      if (path.endsWith("/classes")) {
        return Response.json({ classes: [], classlessEnabled: true });
      }
      return Response.json([]);
    });
    vi.mocked(signInViaObrPopup)
      .mockRejectedValueOnce(new Error("cancelled"))
      .mockImplementationOnce(async (_client, options) => {
        options?.onProgress?.({ state: "registering" });
        await new Promise<void>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new Error("handoff-cancelled")),
            { once: true },
          );
        });
      })
      .mockImplementationOnce(async (_client, options) => {
        options?.onProgress?.({ state: "awaiting-approval", code: "ABC123" });
        await new Promise<void>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new Error("handoff-cancelled")),
            { once: true },
          );
        });
      })
      .mockImplementation(async () => {
        signedIn = true;
      });
    await render(
      <BrowserTestProvider>
        <QueryClientProvider client={client}>
          <Container style={{ width: 420 }}>
            <Bar>Scvmrack</Bar>
            <Body>
              <ObrGmView />
            </Body>
          </Container>
        </QueryClientProvider>
      </BrowserTestProvider>,
    );
    await i18n.changeLanguage(locale);
    const signIn = page.getByRole("button", {
      name: i18n.t("errors.signInAgain"),
      exact: true,
    });
    const partyTab = page.getByRole("tab", {
      name: i18n.t("obr.gm.partyTab"),
      exact: true,
    });
    await expect.element(partyTab).toBeVisible();
    await expect.element(signIn).toBeVisible();
    const button = signIn.element();
    const bounds = button.getBoundingClientRect();
    expect(
      button.contains(
        document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        ),
      ),
    ).toBe(true);
    await userEvent.click(signIn);
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent(i18n.t("obr.player.signInFailed"));
    const failedBounds = button.getBoundingClientRect();
    expect(
      button.contains(
        document.elementFromPoint(
          failedBounds.x + failedBounds.width / 2,
          failedBounds.y + failedBounds.height / 2,
        ),
      ),
    ).toBe(true);
    await userEvent.click(signIn);
    await expect
      .element(
        page.getByRole("button", {
          name: i18n.t("actions.cancel"),
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("alert").getByRole("status"))
      .not.toBeInTheDocument();
    await userEvent.click(
      page.getByRole("button", { name: i18n.t("actions.cancel"), exact: true }),
    );
    await expect.element(signIn).toBeEnabled();
    await userEvent.click(signIn);
    await expect
      .element(page.getByRole("alert").getByRole("status"))
      .toHaveTextContent("ABC123");
    await userEvent.click(
      page.getByRole("button", { name: i18n.t("actions.cancel"), exact: true }),
    );
    await expect.element(signIn).toBeEnabled();
    await userEvent.click(
      page.getByRole("tab", { name: i18n.t("obr.gm.enemiesTab"), exact: true }),
    );
    await userEvent.click(partyTab);
    await userEvent.click(signIn);
    await expect
      .element(page.getByRole("button", { name: /\/join\/qa-invite/ }))
      .toBeVisible();
    await expect.element(signIn).not.toBeInTheDocument();
    expect(appHistory.location.pathname).toBe("/obr.html");
    expect(appHistory.location.search).toContain("obrref=qa-room");
    expect(appHistory.location.search).not.toContain("expired");
    expect(appHistory.location.hash).toBe("#party");
    appHistory.replace("/obr.html?obrref=qa-room&expired=true#party");
    await expect.element(signIn).toBeVisible();
    await expect.element(partyTab).toBeVisible();
    await userEvent.click(signIn);
    await expect.element(signIn).not.toBeInTheDocument();
  },
);
