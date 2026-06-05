import { customStyles } from '@/theme/morkBorgTheme';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import { type ReactNode } from 'react';

type SectionAccordionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded: boolean;
  dataTestId?: string;
};

export function SectionAccordion({
  title,
  children,
  defaultExpanded,
  dataTestId,
}: SectionAccordionProps) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={customStyles.collapsibleSection.accordion}
      data-testid={dataTestId}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={customStyles.collapsibleSection.expandIcon} />}
        sx={customStyles.collapsibleSection.summary}
      >
        <Typography
          variant="subtitle2"
          color="secondary"
          sx={customStyles.collapsibleSection.title}
        >
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={customStyles.collapsibleSection.details}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
