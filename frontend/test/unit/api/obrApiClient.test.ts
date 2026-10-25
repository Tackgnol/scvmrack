import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  bindObrPlayerCharacter: vi.fn(),
  bindObrTokenCharacter: vi.fn(),
  claimAssignedObrCharacter: vi.fn(),
  clearObrPlayerCharacter: vi.fn(),
  clearObrTokenCharacter: vi.fn(),
  fetchObrCards: vi.fn(),
  fetchObrRoomBindings: vi.fn(),
}));

vi.mock("@/api/obr", () => apiMock);

const {
  claimAssignedObrCharacter,
  obrApiClient,
  obrRoomBindingsClient,
} = await import("@/obr/obrApiClient");

describe("OBR package transport adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes package client calls through the app OBR API module", async () => {
    apiMock.fetchObrCards.mockResolvedValue([{ id: "card-1" }]);
    apiMock.fetchObrRoomBindings.mockResolvedValue({ players: [], tokens: [] });
    apiMock.bindObrPlayerCharacter.mockResolvedValue({ playerId: "p1" });
    apiMock.clearObrTokenCharacter.mockResolvedValue(undefined);

    await expect(
      obrApiClient.fetchCards(["c1"], "room-1", "pl"),
    ).resolves.toEqual([{ id: "card-1" }]);
    await expect(obrApiClient.fetchRoomBindings("room-1")).resolves.toEqual({
      players: [],
      tokens: [],
    });
    await obrApiClient.bindPlayerCharacter({
      roomId: "room-1",
      playerId: "p1",
      characterId: "11111111-1111-4111-8111-111111111111",
    });
    await obrApiClient.clearTokenCharacter({ roomId: "room-1", tokenId: "t1" });

    expect(apiMock.fetchObrCards).toHaveBeenCalledWith(
      ["c1"],
      "room-1",
      "pl",
    );
    expect(apiMock.fetchObrRoomBindings).toHaveBeenCalledWith("room-1");
    expect(apiMock.bindObrPlayerCharacter).toHaveBeenCalledWith({
      roomId: "room-1",
      playerId: "p1",
      characterId: "11111111-1111-4111-8111-111111111111",
    });
    expect(apiMock.clearObrTokenCharacter).toHaveBeenCalledWith({
      roomId: "room-1",
      tokenId: "t1",
    });
  });

  it("routes room binding helpers through the same transport module", async () => {
    apiMock.bindObrTokenCharacter.mockResolvedValue({ tokenId: "t1" });
    apiMock.clearObrPlayerCharacter.mockResolvedValue(undefined);

    await obrRoomBindingsClient.bindTokenCharacter?.({
      roomId: "room 1",
      tokenId: "t1",
      characterId: "11111111-1111-4111-8111-111111111111",
    });
    await obrRoomBindingsClient.clearPlayerCharacter({
      roomId: "room 1",
      playerId: "p1",
    });

    expect(apiMock.bindObrTokenCharacter).toHaveBeenCalledWith({
      roomId: "room 1",
      tokenId: "t1",
      characterId: "11111111-1111-4111-8111-111111111111",
    });
    expect(apiMock.clearObrPlayerCharacter).toHaveBeenCalledWith({
      roomId: "room 1",
      playerId: "p1",
    });
  });

  it("re-exports the OBR assignment claim transport", async () => {
    const character = { id: "11111111-1111-4111-8111-111111111111" };
    apiMock.claimAssignedObrCharacter.mockResolvedValue(character);

    await expect(
      claimAssignedObrCharacter({
        roomId: "room-1",
        playerId: "player-1",
        locale: "en",
      }),
    ).resolves.toBe(character);

    expect(apiMock.claimAssignedObrCharacter).toHaveBeenCalledWith({
      roomId: "room-1",
      playerId: "player-1",
      locale: "en",
    });
  });
});
