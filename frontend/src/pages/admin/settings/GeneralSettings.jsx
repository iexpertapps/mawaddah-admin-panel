import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSelect, MawaddahButton } from '../../../components/atoms/mawaddah';
import Textarea from '../../../components/atoms/Textarea';
import { PlatformIcon, ImageIcon, DocumentIcon, LinkIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

const GENERAL_FIELDS = [
  { name: 'platform_name', label: 'Platform Name', type: 'text', placeholder: 'e.g. Mawaddah', icon: <PlatformIcon /> },
  { name: 'default_locale', label: 'Default Locale', type: 'select', options: [
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'Urdu' },
  ], placeholder: 'Select a language', icon: <PlatformIcon /> },
  { name: 'timezone', label: 'Timezone', type: 'text', placeholder: 'e.g. Asia/Karachi', icon: <LinkIcon /> },
  { name: 'logo_url', label: 'Logo URL', type: 'text', placeholder: 'e.g. https://mawaddah.app/logo.png', icon: <ImageIcon /> },
  { name: 'footer_text', label: 'Footer Text', type: 'textarea', placeholder: 'e.g. Mawaddah \u00a9 2024', icon: <DocumentIcon /> },
];

export default function GeneralSettings({ canEdit, theme = 'light' }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });

  useEffect(() => {
    if (settings) {
      reset({
        platform_name: settings.platform_name || '',
        default_locale: settings.default_locale || 'en',
        timezone: settings.timezone || '',
        logo_url: settings.logo_url || '',
        footer_text: settings.footer_text || '',
      });
    }
  }, [settings, reset]);

  const watchedFields = watch();

  const onSubmit = async (data) => {
    const changed = {};
    for (const key of Object.keys(data)) {
      if (data[key] !== settings[key]) {
        changed[key] = data[key];
      }
    }
    if (Object.keys(changed).length > 0) {
      await updateSettings(changed);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div className="text-red-500">Error: {error?.message}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {GENERAL_FIELDS.map(field => (
        <div key={field.name} className="mb-6">
          <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
          {field.type === 'select' ? (
            <MawaddahSelect
              id={field.name}
              options={field.options}
              value={watchedFields[field.name]}
              onChange={val => {
                const event = { target: { name: field.name, value: val } };
                register(field.name).onChange(event);
              }}
              disabled={!canEdit}
              placeholder={field.placeholder}
              className="mb-2"
            />
          ) : field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              {...register(field.name)}
              disabled={!canEdit}
              placeholder={field.placeholder}
              value={watchedFields[field.name]}
              isDirty={formState.dirtyFields[field.name]}
              theme={theme}
              className="mb-2"
            />
          ) : (
            <MawaddahInput
              id={field.name}
              type={field.type}
              {...register(field.name)}
              disabled={!canEdit}
              placeholder={field.placeholder}
              value={watchedFields[field.name]}
              isDirty={formState.dirtyFields[field.name]}
              icon={field.icon}
              className="mb-2"
            />
          )}
        </div>
      ))}
      {canEdit && formState.isDirty && (
        <MawaddahButton type="submit" disabled={isUpdating} variant="save">
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </MawaddahButton>
      )}
      {updateError && <div className="text-red-500">Error: {updateError.message}</div>}
    </form>
  );
} 