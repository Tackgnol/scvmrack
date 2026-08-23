import * as CharacterContextModule from "@/CharacterContext/CharacterContext";
import MiseryTrack from "@/components/molecules/character/MiseryTrack";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import BrowserTestProvider from "../../BrowserTestProvider";

vi.mock("@/CharacterContext/CharacterContext", () => ({
  useCharacter: vi.fn(),
}));

describe("MiseryTrack Browser", () => {
  const updateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { miseryCount: 3 },
      updateField,
    } as ReturnType<typeof CharacterContextModule.useCharacter>);
  });

  it("shows the current run of struck miseries", async () => {
    await render(
      <BrowserTestProvider>
        <MiseryTrack />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByTestId("misery-track")).toBeVisible();
    await expect
      .element(page.getByTestId("misery-count"))
      .toHaveTextContent("3 / 7");
    await expect
      .element(
        page.getByRole("button", { name: "Misery III", exact: true }),
      )
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(page.getByRole("button", { name: "Misery IV", exact: true }))
      .toHaveAttribute("aria-pressed", "false");
  });

  it("strikes through the selected misery", async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { miseryCount: 0 },
      updateField,
    } as ReturnType<typeof CharacterContextModule.useCharacter>);

    await render(
      <BrowserTestProvider>
        <MiseryTrack />
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: "Misery IV", exact: true }),
    );
    await expect.poll(() => updateField).toHaveBeenCalledWith("miseryCount", 4);
  });

  it("unstrikes the last marked misery", async () => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: { miseryCount: 4 },
      updateField,
    } as ReturnType<typeof CharacterContextModule.useCharacter>);

    await render(
      <BrowserTestProvider>
        <MiseryTrack />
      </BrowserTestProvider>,
    );

    await userEvent.click(
      page.getByRole("button", { name: "Misery IV", exact: true }),
    );
    await expect.poll(() => updateField).toHaveBeenCalledWith("miseryCount", 3);
  });

  it("moves between marks with arrow keys", async () => {
    await render(
      <BrowserTestProvider>
        <MiseryTrack />
      </BrowserTestProvider>,
    );

    await userEvent.tab();
    await expect
      .element(page.getByRole("button", { name: "Misery I", exact: true }))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(page.getByRole("button", { name: "Misery II", exact: true }))
      .toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.poll(() => updateField).toHaveBeenCalledWith("miseryCount", 2);
  });
});
