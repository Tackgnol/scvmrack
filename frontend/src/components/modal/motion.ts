import { keyframes } from '@mui/system';

export const modalEnter = keyframes`
  0% { transform: translateY(10px) scale(0.96) rotate(-0.6deg); box-shadow: 6px 6px 0 rgba(255, 62, 181, 0.2); }
  60% { transform: translateY(0) scale(1.02) rotate(0deg); box-shadow: 12px 12px 0 rgba(255, 62, 181, 0.6); }
  100% { transform: translateY(0) scale(1) rotate(0deg); box-shadow: 10px 10px 0 rgba(255, 62, 181, 0.9); }
`;
