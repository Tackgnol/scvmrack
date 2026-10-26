export function obrOpenDestination(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.get("to") === "class") {
    const id = params.get("classId");
    return id && /^[1-9]\d*$/.test(id) ? `/classes/${id}` : null;
  }
  if (params.get("to") === "forge") {
    const room = params.get("obrRoom")?.trim();
    const player = params.get("obrPlayer")?.trim();
    return room && player
      ? `/character/create?${new URLSearchParams({ obrRoom: room, obrPlayer: player })}`
      : null;
  }
  if (params.has("to")) {
    return null;
  }
  const id = params.get("character");
  return id && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)
    ? `/character/${id}`
    : null;
}
