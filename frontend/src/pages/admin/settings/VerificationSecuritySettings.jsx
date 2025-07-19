import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import { KeyIcon, LockIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

const SECURITY_FIELDS = [
  { name: 'otp_provider_key', label: 'OTP Provider Key', type: 'password', sensitive: true, placeholder: 'Enter OTP provider secret key', icon: <KeyIcon /> },
  { name: 'otp_expiry_minutes', label: 'OTP Expiry Minutes', type: 'number', placeholder: 'e.g. 5', icon: <LockIcon /> },
  { name: 'max_otp_attempts', label: 'Max OTP Attempts', type: 'number', placeholder: 'e.g. 3', icon: <LockIcon /> },
  { name: 'enable_email_verification', label: 'Enable Email Verification', type: 'toggle' },
  { name: 'enable_2fa_for_admin', label: 'Enable 2FA for Admin', type: 'toggle' },
  { name: 'allow_dev_tool_access', label: 'Allow Dev Tool Access', type: 'toggle' },
];

export default function VerificationSecuritySettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const [touched, setTouched] = useState({});
  const [editSensitive, setEditSensitive] = useState({});

  useEffect(() => {
    if (settings) {
      reset({
        otp_provider_key: settings.otp_provider_key || '',
        otp_expiry_minutes: settings.otp_expiry_minutes || 5,
        max_otp_attempts: settings.max_otp_attempts || 3,
        enable_email_verification: settings.enable_email_verification || false,
        enable_2fa_for_admin: settings.enable_2fa_for_admin || false,
        allow_dev_tool_access: settings.allow_dev_tool_access || false,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data) => {
    const changed = {};
    for (const key of Object.keys(data)) {
      if (SECURITY_FIELDS.find(f => f.name === key && f.sensitive)) {
        if (data[key] !== settings[key]) {
          changed[key] = data[key];
        }
      } else if (data[key] !== settings[key]) {
        changed[key] = data[key];
      }
    }
    if (Object.keys(changed).length > 0) {
      await updateSettings(changed);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div className="text-red-500">Error: {error?.message}</div>;

  const theme = 'admin'; // Assuming a theme is needed for Input component

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {SECURITY_FIELDS.map(field => (
        <div key={field.name} className="mb-6">
          {field.type === 'toggle' ? (
            <div className="flex items-center mb-2 space-x-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <MawaddahSwitch
                id={field.name}
                checked={!!watch(field.name)}
                onChange={val => {
                  const event = { target: { name: field.name, value: val } };
                  register(field.name).onChange(event);
                }}
                disabled={!canEdit}
              />
            </div>
          ) : (
            <>
              <Label htmlFor={field.name} className="mb-2 block">{field.label}</Label>
              <MawaddahInput
                id={field.name}
                type={field.type === 'password' ? (editSensitive[field.name] ? 'text' : 'password') : field.type}
                {...register(field.name)}
                disabled={!canEdit || (field.sensitive && !editSensitive[field.name])}
                masked={field.sensitive && !editSensitive[field.name]}
                onEdit={() => setEditSensitive(e => ({ ...e, [field.name]: true }))}
                placeholder={field.placeholder}
                value={watch(field.name)}
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