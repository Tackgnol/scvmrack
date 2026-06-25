import { partyColors, partyFonts } from '@/theme/partyTokens';
import { Box, Button, CircularProgress, Typography, styled } from '@mui/material';

export const Page = styled(Box)({
  paddingTop: 16,
  paddingBottom: 16,
  display: 'grid',
  gap: 16,
});

export const Stamp = styled('span')({
  display: 'inline-block',
  width: 'fit-content',
  background: partyColors.pink,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: '0.7rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  padding: '4px 10px',
  border: `2px solid ${partyColors.black}`,
  transform: 'rotate(-1.5deg)',
});

export const Title = styled(Typography)(({ theme }) => ({
  fontFamily: partyFonts.headline,
  color: partyColors.black,
  fontSize: '2.7rem',
  [theme.breakpoints.up('sm')]: { fontSize: '3.4rem' },
  letterSpacing: '0.04em',
  lineHeight: 0.95,
  margin: 0,
})) as typeof Typography;

export const CenterRow = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 32,
  paddingBottom: 32,
});

export const Spinner = styled(CircularProgress)({
  color: partyColors.pink,
});

export const EmptyText = styled(Box)({
  backgroundColor: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `6px 6px 0 ${partyColors.pink}`,
  padding: '20px 22px',
  fontFamily: partyFonts.body,
  fontSize: '1.05rem',
  lineHeight: 1.5,
  transform: 'rotate(-0.5deg)',
});

export const PartyGrid = styled(Box)({
  display: 'grid',
  gap: 12,
});

export const PartyCard = styled(Box)(({ theme }) => ({
  backgroundColor: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `5px 5px 0 ${partyColors.black}`,
  padding: 12,
  display: 'grid',
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('sm')]: { gridTemplateColumns: 'minmax(0, 1fr) auto' },
  gap: 10,
  alignItems: 'center',
}));

export const PartyName = styled(Typography)({
  fontFamily: partyFonts.gothic,
  color: partyColors.yellow,
  fontSize: '1.55rem',
  lineHeight: 1,
  overflowWrap: 'anywhere',
});

export const Meta = styled(Typography)({
  marginTop: 6,
  fontFamily: partyFonts.label,
  color: partyColors.pink,
  fontSize: '0.66rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

export const PartyActionButton = styled(Button)({
  backgroundColor: partyColors.pink,
  color: partyColors.black,
  border: `2px solid ${partyColors.yellow}`,
  borderRadius: 0,
  fontFamily: partyFonts.label,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  minHeight: 54,
  paddingLeft: 16,
  paddingRight: 16,
  '&:hover': { backgroundColor: partyColors.yellow },
}) as typeof Button;
