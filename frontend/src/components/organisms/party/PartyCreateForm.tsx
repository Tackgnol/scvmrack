import { partyColors, partyFonts } from '@/theme/partyTokens';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, TextField, styled } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const PARTY_NAME_MAX_LENGTH = 100;

const partyFormSchema = z.object({
  name: z.string().trim().max(PARTY_NAME_MAX_LENGTH),
});

type PartyFormValues = z.infer<typeof partyFormSchema>;

type PartyCreateFormProps = {
  isAuthLoading: boolean;
  isCreating: boolean;
  onCreate: (name: string) => Promise<boolean>;
};

const CreatePanel = styled(Box)(({ theme }) => ({
  backgroundColor: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `6px 6px 0 ${partyColors.pink}`,
  padding: 12,
  [theme.breakpoints.up('sm')]: {
    padding: 16,
    gridTemplateColumns: 'minmax(0, 1fr) auto',
  },
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 8,
  alignItems: 'start',
})) as typeof Box;

const NameField = styled(TextField)({
  '& .MuiInputBase-root': {
    backgroundColor: partyColors.yellow,
    borderRadius: 0,
    color: partyColors.black,
    fontFamily: partyFonts.body,
  },
  '& .MuiInputBase-input': {
    color: partyColors.black,
    caretColor: partyColors.black,
  },
  '& .MuiInputBase-input::placeholder': {
    color: partyColors.black,
    opacity: 0.6,
  },
  // At rest the label sits inside the yellow input (it stands in for the
  // placeholder), so it must be dark to read. Once it shrinks it floats up onto
  // the black panel, where yellow reads, hence the split.
  '& .MuiInputLabel-root': {
    color: partyColors.black,
    fontFamily: partyFonts.label,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    color: partyColors.yellow,
  },
  '& .MuiInputLabel-root.Mui-error:not(.MuiInputLabel-shrink)': {
    color: partyColors.black,
  },
  '& .MuiInputLabel-root.Mui-error.MuiInputLabel-shrink': {
    color: partyColors.pink,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: partyColors.pink,
    borderWidth: 2,
  },
  '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
    borderColor: partyColors.pink,
  },
  '& .MuiFormHelperText-root': {
    color: partyColors.yellow,
    fontFamily: partyFonts.label,
    fontSize: '0.66rem',
    letterSpacing: '0.1em',
    lineHeight: 1.2,
    marginLeft: 0,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: partyColors.pink,
  },
});

const CreateButton = styled(Button)({
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

export function PartyCreateForm({
  isAuthLoading,
  isCreating,
  onCreate,
}: PartyCreateFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartyFormValues>({
    defaultValues: { name: '' },
    mode: 'onChange',
    resolver: zodResolver(partyFormSchema),
  });

  const handleCreate = async ({ name }: PartyFormValues) => {
    const created = await onCreate(name);
    if (created) {
      reset();
    }
  };

  return (
    <CreatePanel
      component="form"
      onSubmit={(event) => void handleSubmit(handleCreate)(event)}
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <NameField
            {...field}
            label={t('gm.partyNameLabel', 'Party name')}
            placeholder={t('party.defaultName', 'Untitled Warband')}
            disabled={isCreating}
            error={Boolean(errors.name)}
            helperText={
              errors.name
                ? t('gm.partyNameMaxLength', 'Keep it to {{max}} characters or fewer.', {
                    max: PARTY_NAME_MAX_LENGTH,
                  })
                : undefined
            }
          />
        )}
      />
      <CreateButton
        type="submit"
        disabled={isCreating || isAuthLoading || Boolean(errors.name)}
      >
        {isCreating
          ? t('gm.creatingParty', 'Creating...')
          : t('gm.createParty', 'Create party')}
      </CreateButton>
    </CreatePanel>
  );
}
