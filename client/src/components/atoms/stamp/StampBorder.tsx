type StampBorderProps = {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  color: string;
  strokeWidth: number | string;
  dashArray?: string;
};

export function StampBorder({
  x,
  y,
  width,
  height,
  color,
  strokeWidth,
  dashArray,
}: StampBorderProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray}
    />
  );
}

