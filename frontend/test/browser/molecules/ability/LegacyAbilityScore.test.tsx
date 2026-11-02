import { render } from "vitest-browser-react";
import { expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import AbilityCard from "@/components/molecules/ability/AbilityCard";
import { useCharacter } from "@/CharacterContext/CharacterContext";
import i18n, { loadLanguage } from "@/i18n";
import BrowserTestProvider from "../../BrowserTestProvider";

vi.mock("@/CharacterContext/CharacterContext", () => ({
  useCharacter: vi.fn(),
}));

it.each([
  {
    name: "increase",
    edit: () =>
      userEvent.click(
        page.getByRole("button", { name: "Increase Strength", exact: true }),
      ),
    expected: 21,
  },
  {
    name: "decrease",
    edit: () =>
      userEvent.click(
        page.getByRole("button", { name: "Decrease Strength", exact: true }),
      ),
    expected: 21,
  },
  {
    name: "type 25",
    edit: async () => {
      const input = page.getByRole("textbox", { name: "Strength" });
      await userEvent.fill(input, "");
      await userEvent.fill(input, "25");
      await expect
        .poll(() => document.activeElement?.getAttribute("aria-label"))
        .toBe("Strength");
      await userEvent.tab();
    },
    expected: 21,
  },
  {
    name: "type 15",
    edit: async () => {
      const input = page.getByRole('textbox', { name: 'Strength' });
      await userEvent.fill(input, '1');
      await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
      await userEvent.type(input, '5');
      await expect
        .poll(() => document.activeElement?.getAttribute("aria-label"))
        .toBe("Strength");
      await userEvent.keyboard("{Enter}");
    },
    expected: 15,
  },
])(
  "preserves legacy Strength until the $name change is confirmed",
  async ({ edit, expected }) => {
    const updateField = vi.fn();
    const context = {
      character: { id: "legacy", strength: 25 },
      updateField,
    } as unknown as ReturnType<typeof useCharacter>;
    vi.mocked(useCharacter).mockReturnValue(context);
    const screen = await render(
      <BrowserTestProvider>
        <AbilityCard ability="strength" />
      </BrowserTestProvider>,
    );
    const input = page.getByRole("textbox", { name: "Strength" });
    await expect.element(input).toHaveValue("25");
    await edit();
    const warning = page.getByRole("alertdialog", {
      name: "Reduce ability score?",
    });
    await expect.element(warning).toBeVisible();
    await expect
      .element(warning)
      .toHaveAccessibleDescription(
        `Change Strength from 25 to ${expected}? Scores are now limited to 1–21. Your current score stays unchanged unless you confirm.`,
      );
    expect(updateField).not.toHaveBeenCalled();
    await userEvent.click(
      warning.getByRole("button", { name: "Cancel", exact: true }),
    );
    await expect.element(warning).not.toBeInTheDocument();
    await expect.element(input).toHaveValue("25");
    expect(updateField).not.toHaveBeenCalled();
    await edit();
    await userEvent.click(
      page
        .getByRole("alertdialog")
        .getByRole("button", { name: `Change to ${expected}`, exact: true }),
    );
    await expect
      .poll(() => updateField)
      .toHaveBeenCalledExactlyOnceWith("strength", expected);
    vi.mocked(useCharacter).mockReturnValue({
      ...context,
      character: { ...context.character, strength: expected },
    } as ReturnType<typeof useCharacter>);
    await screen.rerender(
      <BrowserTestProvider>
        <AbilityCard ability="strength" />
      </BrowserTestProvider>,
    );
    await expect.element(input).toHaveValue(String(expected));
    await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
  },
);

it("warns in Polish before reducing a legacy score", async () => {
  await loadLanguage("pl");
  await i18n.changeLanguage("pl");
  try {
    const updateField = vi.fn();
    vi.mocked(useCharacter).mockReturnValue({
      character: { id: "legacy", strength: 25 },
      updateField,
    } as unknown as ReturnType<typeof useCharacter>);
    await render(
      <BrowserTestProvider>
        <AbilityCard ability="strength" />
      </BrowserTestProvider>,
    );
    await userEvent.click(
      page.getByRole("button", { name: "Zmniejsz Siłę", exact: true }),
    );
    const warning = page.getByRole("alertdialog", {
      name: "Obniżyć wartość cechy?",
    });
    await expect.element(warning).toBeVisible();
    await expect.element(warning).toHaveTextContent("z 25 na 21");
    expect(updateField).not.toHaveBeenCalled();
    await userEvent.click(
      warning.getByRole("button", { name: "Anuluj", exact: true }),
    );
    await expect
      .element(page.getByRole("textbox", { name: "Siła" }))
      .toHaveValue("25");
  } finally {
    await i18n.changeLanguage("en");
  }
});
