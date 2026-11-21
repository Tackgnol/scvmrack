import { useEffect, useState } from "react";
import { useOwlbear } from "./owlbear";

/** The current room id once Owlbear is ready; empty until then. */
export function useObrRoomId(): string {
  const owlbear = useOwlbear();
  const [roomId, setRoomId] = useState("");

  useEffect(
    () => owlbear.whenReady(() => setRoomId(owlbear.roomId())),
    [owlbear],
  );

  return roomId;
}
