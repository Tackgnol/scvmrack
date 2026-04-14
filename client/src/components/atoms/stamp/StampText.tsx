type StampTextProps = {
  x: number | string;
  y: number | string;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number | string;
  letterSpacing?: number | string;
};

export function StampText({
  x,
  y,
  text,
  color,
  fontFamily,
  fontSize,
  letterSpacing,
}: StampTextProps) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={fontFamily}
      fontSize={fontSize}
      fontWeight="bold"
      textAnchor="middle"
      fill={color}
      letterSpacing={letterSpacing}
    >
      {text}
    </text>
  );
}

