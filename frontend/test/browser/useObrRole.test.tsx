import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { useObrRole } from "@/hooks/useObrRole";

type Role = "GM" | "PLAYER";
type PlayerChangeCallback = (player: { role: Role }) => void;

const obrMock = vi.hoisted(() => {
  let playerChangeCallback: PlayerChangeCallback | null = null;
  const unsubscribePlayerChange = vi.fn();

  return {
    getRole: vi.fn<() => Promise<Role>>(() => Promise.resolve("PLAYER")),
    onReady: vi.fn((callback: () => void) => {
      callback();
    }),
    onChange: vi.fn((callback: PlayerChangeCallback) => {
      playerChangeCallback = callback;
      return unsubscribePlayerChange;
    }),
    reset() {
      playerChangeCallback = null;
      unsubscribePlayerChange.mockClear();
    },
    triggerPlayerChange(role: Role) {
      playerChangeCallback?.({ role });
    },
  };
});

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    player: {
      getRole: obrMock.getRole,
      onChange: obrMock.onChange,
    },
  },
}));

function RoleProbe() {
  const role = useObrRole();
  return <output aria-label="OBR role">{role ?? "pending"}</output>;
}

describe("useObrRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obrMock.reset();
    obrMock.getRole.mockResolvedValue("PLAYER");
  });

  it("resolves the initial OBR player role", async () => {
    obrMock.getRole.mockResolvedValue("GM");

    await render(
      <BrowserTestProvider>
        <RoleProbe />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("GM")).toBeVisible();
    await expect.poll(() => obrMock.getRole).toHaveBeenCalledOnce();
    await expect.poll(() => obrMock.onChange).toHaveBeenCalledOnce();
  });

  it("updates when OBR reports a player role change", async () => {
    await render(
      <BrowserTestProvider>
        <RoleProbe />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("PLAYER")).toBeVisible();

    obrMock.triggerPlayerChange("GM");

    await expect.element(page.getByText("GM")).toBeVisible();
  });
});
