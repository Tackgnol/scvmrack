import { customStyles } from '@theme/morkBorgTheme';
import { BoneBar, BoneIconContainer } from './Header.styled';

// The dynamic bone icon (hamburger to X).
export function BoneIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <BoneIconContainer sx={customStyles.boneIconGap(isOpen)}>
      {[1, 2, 3].map((i) => (
        <BoneBar key={i} index={i} isOpen={isOpen} />
      ))}
    </BoneIconContainer>
  );
}
