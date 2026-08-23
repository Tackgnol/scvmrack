import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export function useObrRoomId(): string {
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    let active = true;
    OBR.onReady(() => {
      if (active) {
        setRoomId(OBR.room.id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return roomId;
}
