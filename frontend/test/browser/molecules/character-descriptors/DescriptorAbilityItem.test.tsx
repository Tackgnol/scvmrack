import { render } from "vitest-browser-react";
import { expect, describe, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import DescriptorAbilityItem from "@/components/molecules/character-descriptors/DescriptorAbilityItem";
import BrowserTestProvider from "../../BrowserTestProvider";

describe("DescriptorAbilityItem Browser", () => {
  const occultHerbmasterDecoctionsKey =
    "abilities.occult_herbmaster.decoctions";

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

  it("shows decoctions button for Occult Herbmaster with decoctions key", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem
          {...defaultProps}
          isOccultHerbmaster={true}
          ability={{
            key: occultHerbmasterDecoctionsKey,
            name: "Portable Laboratory",
            description: "desc",
            comment: "",
          }}
        />
      </BrowserTestProvider>,
    );

    const button = page.getByRole("button", { name: /view decoctions/i });
    await expect.element(button).toBeVisible();
  });

  it("shows decoctions button for keyed Polish Portable Laboratory ability", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem
          {...defaultProps}
          isOccultHerbmaster={true}
          ability={{
            key: occultHerbmasterDecoctionsKey,
            name: "Przenośne laboratorium",
            description: "opis",
            comment: "",
          }}
        />
      </BrowserTestProvider>,
    );

    const button = page.getByRole("button", { name: /view decoctions/i });
    await expect.element(button).toBeVisible();
  });

  it("does not show decoctions button for matching text without decoctions key", async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem
          {...defaultProps}
          isOccultHerbmaster={true}
          ability={{
            name: "Portable Laboratory",
            description: "desc",
            comment: "",
          }}
        />
      </BrowserTestProvider>,
    );

    const button = page.getByRole("button", { name: /view decoctions/i });
    await expect.element(button).not.toBeInTheDocument();
  });
});
