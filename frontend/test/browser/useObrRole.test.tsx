import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { useObrRole } from "@/hooks/useObrRole";
import { createMemoryOwlbear } from "../obr/memoryOwlbear";

function RoleProbe() {
  const role = useObrRole();
  return <output aria-label="OBR role">{role ?? "pending"}</output>;
}

describe("useObrRole", () => {
  it("resolves the initial OBR player role", async () => {
    const owlbear = createMemoryOwlbear({ role: "GM" });

    await render(
      <BrowserTestProvider owlbear={owlbear}>
        <RoleProbe />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("GM")).toBeVisible();
  });

  it("waits for Owlbear to be ready before reporting a role", async () => {
    const owlbear = createMemoryOwlbear({ ready: false, role: "GM" });

    await render(
      <BrowserTestProvider owlbear={owlbear}>
        <RoleProbe />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("pending")).toBeVisible();

    owlbear.becomeReady();

    await expect.element(page.getByText("GM")).toBeVisible();
  });

  it("updates when OBR reports a player role change", async () => {
    const owlbear = createMemoryOwlbear({ role: "PLAYER" });

    await render(
      <BrowserTestProvider owlbear={owlbear}>
        <RoleProbe />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("PLAYER")).toBeVisible();

    owlbear.setRole("GM");

    await expect.element(page.getByText("GM")).toBeVisible();
  });
});
