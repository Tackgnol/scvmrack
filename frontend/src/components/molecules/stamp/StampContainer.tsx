import { StampBorder } from '@/components/atoms/stamp/StampBorder';

type StampContainerProps = {
  color: string;
};

export function StampContainer({ color }: StampContainerProps) {
  return (
    <g className="stamp-container">
      <StampBorder
        x="15"
        y="15"
        width="470"
        height="210"
        color={color}
        strokeWidth="8"
        dashArray="25, 2, 15, 1, 30, 3"
      />
      <StampBorder
        x="22"
        y="22"
        width="456"
        height="196"
        color={color}
        strokeWidth="3"
        dashArray="10, 4, 20, 2"
      />
    </g>
  );
}

