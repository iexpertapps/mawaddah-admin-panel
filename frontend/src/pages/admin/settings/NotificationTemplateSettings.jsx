import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import Textarea from '../../../components/atoms/Textarea';
import { MailIcon, MegaphoneIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

export default function NotificationTemplateSettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, control, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'reminder_days',
  });

  useEffect(() => {
    if (settings) {
      reset({
        reminder_days: settings.reminder_days || [1, 4, 7],
        reminder_template_text: settings.reminder_template_text || '',
        notify_shura_on_skipped_donors: settings.notify_shura_on_skipped_donors || false,
        email_from_name: settings.email_from_name || '',
        whatsapp_template_text: settings.whatsapp_template_text || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data) => {
    const changed = {};
    for (const key of Object.keys(data)) {
      if (JSON.stringify(data[key]) !== JSON.stringify(settings[key])) {
        changed[key] = data[key];
      }
    }
    if (Object.keys(changed).length > 0) {
      await updateSettings(changed);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div className="text-red-500">Error: {error?.message}</div>;

  const theme = 'admin'; // Assuming a theme context is available or passed

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label className="mb-2 block">Reminder Days</Label>
        <div className="flex flex-wrap gap-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-1">
              <MawaddahInput
                type="number"
                {...register(`reminder_days.${idx}`, { valueAsNumber: true })}
                disabled={!canEdit}
                placeholder="e.g. 1"
                value={watch().reminder_days?.[idx]}
                isDirty={formState.dirtyFields.reminder_days && formState.dirtyFields.reminder_days[idx]}
                className="w-20 mb-2"
                icon={<MegaphoneIcon />}
              />
              {canEdit && (
                <MawaddahButton type="button" onClick={() => remove(idx)} className="text-red-500 px-2 py-1" variant="add">&times;</MawaddahButton>
              )}
            </div>
          ))}
          {canEdit && (
            <MawaddahButton type="button" onClick={() => append(0)} variant="add">Add</MawaddahButton>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="reminder_template_text" className="mb-2 block">Reminder Template Text</Label>
        <Textarea
          id="reminder_template_text"
          {...register('reminder_template_text')}
          disabled={!canEdit}
          placeholder="e.g. Your donation is due on {{due_date}}."
          value={watch().reminder_template_text}
          isDirty={formState.dirtyFields.reminder_template_text}
          theme={theme}
          className="mb-2"
        />
      </div>
      <div className="flex items-center mb-2 space-x-2">
        <Label htmlFor="notify_shura_on_skipped_donors">Notify Shura on Skipped Donors</Label>
        <MawaddahSwitch
          id="notify_shura_on_skipped_donors"
          checked={!!watch('notify_shura_on_skipped_donors')}
          onChange={val => {
            const event = { target: { name: 'notify_shura_on_skipped_donors', value: val } };
            register('notify_shura_on_skipped_donors').onChange(event);
          }}
          disabled={!canEdit}
        />
      </div>
      <div>
        <Label htmlFor="email_from_name" className="mb-2 block">Email From Name</Label>
        <MawaddahInput
          id="email_from_name"
          type="text"
          {...register('email_from_name')}
          disabled={!canEdit}
          placeholder="e.g. Mawaddah Team"
          value={watch().email_from_name}
          isDirty={formState.dirtyFields.email_from_name}
          icon={<MailIcon />}
          className="mb-2"
        />
      </div>
      <div>
        <Label htmlFor="whatsapp_template_text" className="mb-2 block">WhatsApp Template Text</Label>
        <Textarea
          id="whatsapp_template_text"
          {...register('whatsapp_template_text')}
          disabled={!canEdit}
          placeholder="e.g. Your donation is due on {{due_date}}."
          value={watch().whatsapp_template_text}
          isDirty={formState.dirtyFields.whatsapp_template_text}
          theme={theme}
          className="mb-2"
        />
      </div>
      {canEdit && formState.isDirty && (
        <MawaddahButton type="submit" disabled={isUpdating} variant="save">
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </MawaddahButton>
      )}
      {updateError && <div className="text-red-500">Error: {updateError.message}</div>}
    </form>
  );
} 