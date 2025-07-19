import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSelect, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import Textarea from '../../../components/atoms/Textarea';
import { MobileIcon, MegaphoneIcon, LinkIcon, PlatformIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

const MOBILE_FIELDS = [
  { name: 'app_required_version', label: 'App Required Version', type: 'text', placeholder: 'e.g. 1.2.3', icon: <MobileIcon /> },
  { name: 'announcement_banner', label: 'Announcement Banner', type: 'textarea', placeholder: 'e.g. Ramadan Mubarak! Donate now.', icon: <MegaphoneIcon /> },
  { name: 'disable_appeals_for_new_users', label: 'Disable Appeals for New Users', type: 'toggle' },
  { name: 'default_app_language', label: 'Default App Language', type: 'select', options: [
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'Urdu' },
  ], placeholder: 'Select a language', icon: <PlatformIcon /> },
  { name: 'deep_link_base_url', label: 'Deep Link Base URL', type: 'text', placeholder: 'e.g. https://mawaddah.app', icon: <LinkIcon /> },
];

export default function MobileAppSettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const theme = 'light';

  useEffect(() => {
    if (settings) {
      reset({
        app_required_version: settings.app_required_version || '',
        announcement_banner: settings.announcement_banner || '',
        disable_appeals_for_new_users: settings.disable_appeals_for_new_users || false,
        default_app_language: settings.default_app_language || 'en',
        deep_link_base_url: settings.deep_link_base_url || '',
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
      {MOBILE_FIELDS.map(field => (
        <div key={field.name} className="mb-6">
          {field.type === 'toggle' ? (
            <div className="flex items-center mb-2 space-x-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <MawaddahSwitch
                id={field.name}
                checked={!!watchedFields[field.name]}
                onChange={val => {
                  const event = { target: { name: field.name, value: val } };
                  register(field.name).onChange(event);
                }}
                disabled={!canEdit}
              />
            </div>
          ) : field.type === 'select' ? (
            <>
              <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
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
            </>
          ) : field.type === 'textarea' ? (
            <>
              <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
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
            </>
          ) : (
            <>
              <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
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
            </>
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