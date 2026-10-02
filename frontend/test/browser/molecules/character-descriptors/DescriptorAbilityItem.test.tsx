import { render } from "vitest-browser-react";
import { expect, describe, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import DescriptorAbilityItem from "@/components/molecules/character-descriptors/DescriptorAbilityItem";
import BrowserTestProvider from "../../BrowserTestProvider";

vi.mock("@/utils/rollDie", () => ({ rollDie: vi.fn(async () => 2) }));

describe("DescriptorAbilityItem Browser", () => {
  const defaultProps = {
    ability: {
      name: "Test Ability",
      description: "Test Description",
      comment: "",
    },
    index: 0,
    onUpdateComment: vi.fn(),
  };

  it("renders name and description", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText("Test Ability")).toBeVisible();
    await expect.element(page.getByText("Test Description")).toBeVisible();
  });

  it("triggers onUpdateComment when comment is changed", async () => {
    const onUpdateComment = vi.fn();
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem
          {...defaultProps}
          onUpdateComment={onUpdateComment}
          ability={{ ...defaultProps.ability, comment: "old" }}
        />
      </BrowserTestProvider>,
    );

    const input = page.getByTestId("ability-comment-0-input");
    await userEvent.fill(input, "new comment");

    expect(onUpdateComment).toHaveBeenCalledWith("new comment");
  });

  it("opens the comment field from keyboard activation", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} />
      </BrowserTestProvider>,
    );

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");

    await expect
      .element(page.getByTestId("ability-comment-0-input"))
      .toBeVisible();
  });

  const tableAbility = {
    key: "abilities.occult_herbmaster.decoctions",
    name: "Portable Laboratory",
    description: "Brew decoctions.",
    comment: "",
    table: {
      die: 2,
      rows: [
        { roll: 1, text: "Red Poison: DR12 or -D10 HP.", itemKey: "equipment.red-poison", itemName: "Red Poison" },
        { roll: 2, text: "Elixir Vitalis: Heals D6 HP.", itemKey: null, itemName: null },
      ],
    },
  };

  it("keeps a reference table closed until it is opened", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} ability={tableAbility} />
      </BrowserTestProvider>,
    );

    const toggle = page.getByRole("button", { name: "d2 table" });
    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.element(page.getByText("Red Poison: DR12 or -D10 HP.")).not.toBeVisible();

    await userEvent.click(toggle);

    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
    await expect.element(page.getByText("Red Poison: DR12 or -D10 HP.")).toBeVisible();
    await expect.element(page.getByText("Gives Red Poison")).toBeVisible();
    await expect.element(page.getByTestId("ability-comment-0-input")).not.toBeVisible();
  });

  it("rolls the table, marks the rolled row and changes nothing on the character", async () => {
    const onUpdateComment = vi.fn();
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} onUpdateComment={onUpdateComment} ability={tableAbility} />
      </BrowserTestProvider>,
    );

    await userEvent.click(page.getByRole("button", { name: "Roll d2" }));

    await expect.element(page.getByRole("status")).toHaveTextContent("Rolled 2");
    const rolledRow = page.getByText("Elixir Vitalis: Heals D6 HP.").element().closest("li");
    expect(rolledRow?.getAttribute("aria-current")).toBe("true");
    expect(onUpdateComment).not.toHaveBeenCalled();
  });

  it("shows no table controls for an ability without a table", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByRole("button", { name: /table/i })).not.toBeInTheDocument();
  });
});
