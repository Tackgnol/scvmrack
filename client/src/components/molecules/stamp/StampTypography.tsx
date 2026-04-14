import { StampText } from '@/components/atoms/stamp/StampText';

type StampTypographyProps = {
  mainText: string;
  mainColor: string;
  dateText: string;
  dateColor: string;
};

export function StampTypography({
  mainText,
  mainColor,
  dateText,
  dateColor,
}: StampTypographyProps) {
  return (
    <g className="stamp-typography">
      <StampText
        x="250"
        y="130"
        text={mainText}
        color={mainColor}
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontSize="105"
        letterSpacing="8"
      />
      <StampText
        x="250"
        y="195"
        text={dateText}
        color={dateColor}
        fontFamily="'Courier New', Courier, monospace"
        fontSize="46"
        letterSpacing="8"
      />
    </g>
  );
}

