import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowserTestProvider from "./BrowserTestProvider";
import { ObrGmSession } from "@/components/obr/ObrGmSession/ObrGmSession";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/obr/useObrSession", () => ({
  useObrSession: mocks.session,
}));

function session(isAuthenticated: boolean) {
  mocks.session.mockReturnValue({
    isLoading: false,
    isAuthenticated,
    signIn: vi.fn(),
    signOut: mocks.signOut,
    cancelSignIn: undefined,
    signInProgress: null,
  });
}

describe("ObrGmSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers Sign out to a signed-in owner and signs out on click", async () => {
    session(true);
    render(
      <BrowserTestProvider>
        <ObrGmSession />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "Sign out" }));

    await expect.poll(() => mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("offers sign in, not Sign out, to a signed-out visitor", async () => {
    session(false);
    render(
      <BrowserTestProvider>
        <ObrGmSession />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("Sign in as the owner to manage invites")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });
});
