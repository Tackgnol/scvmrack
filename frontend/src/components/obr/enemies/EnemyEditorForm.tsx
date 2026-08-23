import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createEnemyStatusId, type ObrEnemy } from "@/obr/enemies";
import {
  createEmptyAttack,
  createEmptyLoot,
  createEmptySpecial,
  enemyFormSchema,
  getDefaultEnemyFormValues,
  toEnemyFormValues,
  type EnemyFormInput,
  type EnemyFormValues,
} from "./enemyForm";
import {
  EnemyButton,
  EnemyDangerButton,
  EnemyDynamicRow,
  EnemyDynamicRows,
  EnemyFormActions,
  EnemyFormGrid,
  EnemyFormPanel,
  EnemyStatusRow,
  EnemyStatusRows,
  EnemyTextField,
  EnemyTitle,
} from "../ObrEnemies.styles";

export type EnemyEditorFormProps = {
  enemy: ObrEnemy | null;
  title: string;
  onSubmit: (values: EnemyFormValues) => Promise<void>;
  onCancel?: () => void;
};

export function EnemyEditorForm({
  enemy,
  title,
  onSubmit,
  onCancel,
}: EnemyEditorFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnemyFormInput, unknown, EnemyFormValues>({
    defaultValues: enemy
      ? toEnemyFormValues(enemy)
      : getDefaultEnemyFormValues(),
    mode: "onChange",
    resolver: zodResolver(enemyFormSchema),
  });
  const {
    fields: statusFields,
    append: appendStatus,
    remove: removeStatus,
  } = useFieldArray({
    control,
    name: "statuses",
    keyName: "fieldId",
  });
  const {
    fields: attackFields,
    append: appendAttack,
    remove: removeAttack,
  } = useFieldArray({
    control,
    name: "attacks",
    keyName: "fieldId",
  });
  const {
    fields: specialFields,
    append: appendSpecial,
    remove: removeSpecial,
  } = useFieldArray({
    control,
    name: "specials",
    keyName: "fieldId",
  });
  const {
    fields: lootFields,
    append: appendLoot,
    remove: removeLoot,
  } = useFieldArray({
    control,
    name: "loot",
    keyName: "fieldId",
  });

  return (
    <EnemyFormPanel onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <EnemyTitle>{title}</EnemyTitle>
      <EnemyFormGrid>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              label={t("obr.enemies.nameLabel", "Name")}
              error={Boolean(errors.name)}
              helperText={
                errors.name
                  ? t("obr.enemies.nameRequired", "Name is required")
                  : undefined
              }
            />
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              label={t("obr.enemies.typeLabel", "Type")}
              error={Boolean(errors.type)}
            />
          )}
        />
        <Controller
          name="habitat"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              label={t("obr.enemies.habitatLabel", "Habitat")}
              error={Boolean(errors.habitat)}
            />
          )}
        />
        <Controller
          name="currentHealth"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              type="number"
              label={t("obr.enemies.currentHealthLabel", "Current HP")}
              error={Boolean(errors.currentHealth)}
              helperText={
                errors.currentHealth
                  ? t("obr.enemies.currentHealthInvalid", "Use 0 to 999")
                  : undefined
              }
              inputProps={{ min: 0, max: 999, step: 1 }}
            />
          )}
        />
        <Controller
          name="maxHealth"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              type="number"
              label={t("obr.enemies.maxHealthLabel", "HP")}
              error={Boolean(errors.maxHealth)}
              helperText={
                errors.maxHealth
                  ? t("obr.enemies.maxHealthInvalid", "Use 1 to 999")
                  : undefined
              }
              inputProps={{ min: 1, max: 999, step: 1 }}
            />
          )}
        />
        <Controller
          name="morale"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              type="number"
              label={t("obr.enemies.moraleLabel", "Morale")}
              error={Boolean(errors.morale)}
              helperText={
                errors.morale
                  ? t("obr.enemies.moraleInvalid", "Use 0 to 99")
                  : undefined
              }
              inputProps={{ min: 0, max: 99, step: 1 }}
            />
          )}
        />
      </EnemyFormGrid>

      <EnemyFormGrid>
        <Controller
          name="armorDie"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              label={t("obr.enemies.armorDieLabel", "Armor die")}
              error={Boolean(errors.armorDie)}
            />
          )}
        />
        <Controller
          name="armorDescription"
          control={control}
          render={({ field }) => (
            <EnemyTextField
              {...field}
              label={t(
                "obr.enemies.armorDescriptionLabel",
                "Armor description",
              )}
              error={Boolean(errors.armorDescription)}
            />
          )}
        />
      </EnemyFormGrid>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <EnemyTextField
            {...field}
            multiline
            minRows={3}
            label={t("obr.enemies.gmDescriptionLabel", "GM description")}
            error={Boolean(errors.description)}
            helperText={
              errors.description
                ? t(
                    "obr.enemies.descriptionInvalid",
                    "Keep it to 500 characters",
                  )
                : undefined
            }
          />
        )}
      />

      <Controller
        name="playerDescription"
        control={control}
        render={({ field }) => (
          <EnemyTextField
            {...field}
            multiline
            minRows={3}
            label={t(
              "obr.enemies.playerDescriptionLabel",
              "Player description",
            )}
            error={Boolean(errors.playerDescription)}
            helperText={
              errors.playerDescription
                ? t(
                    "obr.enemies.descriptionInvalid",
                    "Keep it to 500 characters",
                  )
                : undefined
            }
          />
        )}
      />

      <EnemyStatusRows>
        <EnemyTitle>{t("obr.enemies.attacksTitle", "Attacks")}</EnemyTitle>
        <EnemyDynamicRows>
          {attackFields.map((field, index) => (
            <EnemyDynamicRow key={field.fieldId}>
              <Controller
                name={`attacks.${index}.name`}
                control={control}
                render={({ field: nameField }) => (
                  <EnemyTextField
                    {...nameField}
                    label={t("obr.enemies.attackNameLabel", "Attack")}
                    error={Boolean(errors.attacks?.[index]?.name)}
                  />
                )}
              />
              <Controller
                name={`attacks.${index}.die`}
                control={control}
                render={({ field: dieField }) => (
                  <EnemyTextField
                    {...dieField}
                    label={t("obr.enemies.attackDieLabel", "Die")}
                    error={Boolean(errors.attacks?.[index]?.die)}
                  />
                )}
              />
              <EnemyDangerButton
                type="button"
                onClick={() => removeAttack(index)}
                disabled={attackFields.length <= 1}
                aria-label={t("obr.enemies.removeAttack", "Remove attack")}
              >
                <DeleteIcon fontSize="small" />
              </EnemyDangerButton>
            </EnemyDynamicRow>
          ))}
        </EnemyDynamicRows>
        <EnemyButton
          type="button"
          onClick={() => appendAttack(createEmptyAttack())}
          startIcon={<AddIcon />}
        >
          {t("obr.enemies.addAttack", "Add attack")}
        </EnemyButton>
      </EnemyStatusRows>

      <EnemyStatusRows>
        <EnemyTitle>
          {t("obr.enemies.specialsTitle", "Special skills")}
        </EnemyTitle>
        <EnemyDynamicRows>
          {specialFields.map((field, index) => (
            <EnemyDynamicRow key={field.fieldId}>
              <Controller
                name={`specials.${index}.name`}
                control={control}
                render={({ field: nameField }) => (
                  <EnemyTextField
                    {...nameField}
                    label={t("obr.enemies.specialNameLabel", "Skill")}
                    error={Boolean(errors.specials?.[index]?.name)}
                  />
                )}
              />
              <Controller
                name={`specials.${index}.description`}
                control={control}
                render={({ field: descriptionField }) => (
                  <EnemyTextField
                    {...descriptionField}
                    label={t(
                      "obr.enemies.specialDescriptionLabel",
                      "Description",
                    )}
                    error={Boolean(errors.specials?.[index]?.description)}
                  />
                )}
              />
              <EnemyDangerButton
                type="button"
                onClick={() => removeSpecial(index)}
                disabled={specialFields.length <= 1}
                aria-label={t(
                  "obr.enemies.removeSpecial",
                  "Remove special skill",
                )}
              >
                <DeleteIcon fontSize="small" />
              </EnemyDangerButton>
            </EnemyDynamicRow>
          ))}
        </EnemyDynamicRows>
        <EnemyButton
          type="button"
          onClick={() => appendSpecial(createEmptySpecial())}
          startIcon={<AddIcon />}
        >
          {t("obr.enemies.addSpecial", "Add special")}
        </EnemyButton>
      </EnemyStatusRows>

      <EnemyStatusRows>
        <EnemyTitle>{t("obr.enemies.lootTitle", "Loot")}</EnemyTitle>
        <EnemyDynamicRows>
          {lootFields.map((field, index) => (
            <EnemyDynamicRow key={field.fieldId}>
              <Controller
                name={`loot.${index}.label`}
                control={control}
                render={({ field: labelField }) => (
                  <EnemyTextField
                    {...labelField}
                    label={t("obr.enemies.lootLabelLabel", "Label")}
                    error={Boolean(errors.loot?.[index]?.label)}
                  />
                )}
              />
              <Controller
                name={`loot.${index}.value`}
                control={control}
                render={({ field: valueField }) => (
                  <EnemyTextField
                    {...valueField}
                    label={t("obr.enemies.lootValueLabel", "Value")}
                    error={Boolean(errors.loot?.[index]?.value)}
                  />
                )}
              />
              <EnemyDangerButton
                type="button"
                onClick={() => removeLoot(index)}
                disabled={lootFields.length <= 1}
                aria-label={t("obr.enemies.removeLoot", "Remove loot")}
              >
                <DeleteIcon fontSize="small" />
              </EnemyDangerButton>
            </EnemyDynamicRow>
          ))}
        </EnemyDynamicRows>
        <EnemyButton
          type="button"
          onClick={() => appendLoot(createEmptyLoot())}
          startIcon={<AddIcon />}
        >
          {t("obr.enemies.addLoot", "Add loot")}
        </EnemyButton>
      </EnemyStatusRows>

      <EnemyStatusRows>
        <EnemyTitle>
          {t("obr.enemies.statusBandsTitle", "Status bands")}
        </EnemyTitle>
        {statusFields.map((field, index) => (
          <EnemyStatusRow key={field.fieldId}>
            <Controller
              name={`statuses.${index}.percent`}
              control={control}
              render={({ field: percentField }) => (
                <EnemyTextField
                  {...percentField}
                  type="number"
                  label={t("obr.enemies.statusPercentLabel", "At %")}
                  error={Boolean(errors.statuses?.[index]?.percent)}
                  inputProps={{ min: 1, max: 100, step: 1 }}
                />
              )}
            />
            <Controller
              name={`statuses.${index}.label`}
              control={control}
              render={({ field: labelField }) => (
                <EnemyTextField
                  {...labelField}
                  label={t("obr.enemies.statusLabelLabel", "Label")}
                  error={Boolean(errors.statuses?.[index]?.label)}
                />
              )}
            />
            <EnemyDangerButton
              type="button"
              onClick={() => removeStatus(index)}
              disabled={statusFields.length <= 1}
              aria-label={t("obr.enemies.removeStatus", "Remove status")}
            >
              <DeleteIcon fontSize="small" />
            </EnemyDangerButton>
          </EnemyStatusRow>
        ))}
        <EnemyButton
          type="button"
          onClick={() =>
            appendStatus({
              id: createEnemyStatusId(),
              percent: 25,
              label: t("obr.enemies.customStatus", "Custom"),
            })
          }
          startIcon={<AddIcon />}
        >
          {t("obr.enemies.addStatus", "Add status")}
        </EnemyButton>
      </EnemyStatusRows>

      <EnemyFormActions>
        <EnemyButton
          type="submit"
          disabled={isSubmitting}
          startIcon={<SaveIcon />}
        >
          {isSubmitting
            ? t("obr.enemies.saving", "Saving")
            : t("obr.enemies.saveEnemy", "Save enemy")}
        </EnemyButton>
        {onCancel && (
          <EnemyButton type="button" onClick={onCancel}>
            {t("actions.cancel", "Cancel")}
          </EnemyButton>
        )}
      </EnemyFormActions>
    </EnemyFormPanel>
  );
}
