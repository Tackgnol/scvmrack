import { useCharacter } from "@/CharacterContext/CharacterContext";
import { MiseryTrackRoot } from "./MiseryTrack.styled";
import { normalizeMiseryCount } from "./miseryTrackUtils";

export default function MiseryTrack({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
  const { character, updateField } = useCharacter();
  const count = normalizeMiseryCount(character?.miseryCount);

  return (
    <MiseryTrackRoot
      id="miseries"
      testId="misery-track"
      count={count}
      onChange={
        readOnly
          ? undefined
          : (nextCount) => updateField("miseryCount", nextCount)
      }
    />
  );
}
