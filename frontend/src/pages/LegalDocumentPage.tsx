import { Box, Paper, Stack, Typography } from "@mui/material";
import type { LegalDocument } from "@/pages/legalCopy";
import { morkBorgColors } from "@/theme/morkBorgTheme";

interface LegalDocumentPageProps {
  document: LegalDocument;
}

const emailPattern = /([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g;

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: "auto",
        py: { xs: 3, sm: 6 },
        px: { xs: 2, sm: 3 },
        color: morkBorgColors.black,
        "& a, & a:visited": {
          color: "inherit",
          fontWeight: 700,
          textUnderlineOffset: "0.2em",
        },
        "& a:hover": {
          color: morkBorgColors.yellow,
          backgroundColor: morkBorgColors.black,
        },
        "& a:focus-visible": {
          outline: `2px solid ${morkBorgColors.black}`,
          outlineOffset: 3,
        },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 800, overflowWrap: "anywhere" }}
          >
            {document.title}
          </Typography>
          {document.lastUpdated && (
            <Typography component="p" sx={{ mt: 1, fontWeight: 700 }}>
              {document.lastUpdated}
            </Typography>
          )}
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            color: morkBorgColors.white,
            backgroundColor: morkBorgColors.black,
            border: "2px solid",
            borderColor: "text.primary",
          }}
        >
          <Typography component="p" sx={{ fontSize: "1rem", lineHeight: 1.7 }}>
            {document.introduction}
          </Typography>
        </Paper>
        {document.sections.map((section) => (
          <Box component="section" key={section.title}>
            <Typography
              component="h2"
              id={section.id}
              variant="h5"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              {section.title}
            </Typography>
            <Stack spacing={1.5}>
              {section.paragraphs.map((paragraph) => (
                <Typography
                  component="p"
                  key={paragraph}
                  sx={{
                    m: 0,
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {paragraph.split(emailPattern).map((part) =>
                    part.includes("@") ? (
                      <a href={`mailto:${part}`} key={part}>
                        {part}
                      </a>
                    ) : (
                      part
                    ),
                  )}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
