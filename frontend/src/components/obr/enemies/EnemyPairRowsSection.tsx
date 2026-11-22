import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Controller,
  get,
  useFieldArray,
  useFormState,
  type FieldArray,
  type FieldPath,
} from "react-hook-form";
import type { EnemyFormInput } from "./enemyForm";
import type {
  EnemyPairListName,
  EnemyPairRowsSectionProps,
} from "./EnemyPairRowsSection.models";
import {
  EnemyButton,
  EnemyDangerButton,
  EnemyDynamicRow,
  EnemyDynamicRows,
  EnemyStatusRows,
  EnemyTextField,
  EnemyTitle,
} from "../ObrEnemies.styles";

/** Editable list of two-field enemy rows (attacks, specials, loot); keeps at least one row. */
export function EnemyPairRowsSection<N extends EnemyPairListName>({
  control,
  name,
  fieldKeys,
  fieldLabels,
  title,
  addLabel,
  removeLabel,
  createEmpty,
}: EnemyPairRowsSectionProps<N>) {
  const { errors } = useFormState({ control, name });
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    keyName: "fieldId",
  });

  return (
    <EnemyStatusRows>
      <EnemyTitle>{title}</EnemyTitle>
      <EnemyDynamicRows>
        {fields.map((field, index) => (
          <EnemyDynamicRow key={field.fieldId}>
            {fieldKeys.map((key, keyIndex) => {
              const path =
                `${name}.${index}.${String(key)}` as FieldPath<EnemyFormInput>;
              return (
                <Controller
                  key={String(key)}
                  name={path}
                  control={control}
                  render={({ field: inputField }) => (
                    <EnemyTextField
                      {...inputField}
                      label={fieldLabels[keyIndex]}
                      error={Boolean(get(errors, path))}
                    />
                  )}
                />
              );
            })}
            <EnemyDangerButton
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              aria-label={removeLabel}
            >
              <DeleteIcon fontSize="small" />
            </EnemyDangerButton>
          </EnemyDynamicRow>
        ))}
      </EnemyDynamicRows>
      <EnemyButton
        type="button"
        onClick={() => append(createEmpty() as FieldArray<EnemyFormInput, N>)}
        startIcon={<AddIcon />}
      >
        {addLabel}
      </EnemyButton>
    </EnemyStatusRows>
  );
}
