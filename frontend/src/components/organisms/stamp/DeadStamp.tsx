import { DistressFilter } from '@/components/atoms/stamp/DistressFilter';
import { StampContainer } from '@/components/molecules/stamp/StampContainer';
import { StampTypography } from '@/components/molecules/stamp/StampTypography';

// Built once at module scope — Intl formatters are expensive to construct.
const stampMonthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' });

function formatStampDate(d: Date) {
  // Match the intended stamp vibe: "OCT 31 2024"
  const month = stampMonthFormat.format(d).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${month} ${day} ${year}`;
}

type DeadStampProps = {
  mainColor?: string;
  dateColor?: string;
  mainText?: string;
  date?: string;
  maxWidthPx?: number;
};

export function DeadStamp({
  mainColor = '#000000',
  dateColor = '#c1121f',
  mainText = 'DEAD',
  date = formatStampDate(new Date()),
  maxWidthPx = 500,
}: DeadStampProps) {
  const filterId = 'stamp-distress';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 240"
      width="100%"
      height="100%"
      style={{ maxWidth: `${maxWidthPx}px` }}
    >
      <defs>
        <DistressFilter id={filterId} />
      </defs>

      <g filter={`url(#${filterId})`}>
        <StampContainer color={mainColor} />
        <StampTypography
          mainText={mainText}
          mainColor={mainColor}
          dateText={date}
          dateColor={dateColor}
        />
      </g>
    </svg>
  );
}

export default DeadStamp;

