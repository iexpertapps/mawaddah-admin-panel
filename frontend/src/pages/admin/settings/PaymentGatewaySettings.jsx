import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSelect, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import { CardIcon, KeyIcon, PlatformIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

const GATEWAY_FIELDS = [
  { name: 'stripe_public_key', label: 'Stripe Public Key', type: 'text', placeholder: 'e.g. pk_live_...', icon: <CardIcon /> },
  { name: 'stripe_secret_key', label: 'Stripe Secret Key', type: 'password', sensitive: true, placeholder: 'Enter Stripe secret key', icon: <KeyIcon /> },
  { name: 'jazzcash_merchant_id', label: 'JazzCash Merchant ID', type: 'text', placeholder: 'e.g. 123456', icon: <PlatformIcon /> },
  { name: 'jazzcash_password', label: 'JazzCash Password', type: 'password', sensitive: true, placeholder: 'Enter JazzCash password', icon: <KeyIcon /> },
  { name: 'easypaisa_token', label: 'Easypaisa Token', type: 'password', sensitive: true, placeholder: 'Enter Easypaisa token', icon: <KeyIcon /> },
  { name: 'default_gateway', label: 'Default Gateway', type: 'select', options: [
    { value: 'stripe', label: 'Stripe' },
    { value: 'jazzcash', label: 'JazzCash' },
    { value: 'easypaisa', label: 'Easypaisa' },
  ], placeholder: 'Select a gateway', icon: <CardIcon /> },
  { name: 'payment_test_mode', label: 'Payment Test Mode', type: 'toggle' },
];

export default function PaymentGatewaySettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, formState, setValue, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const [touched, setTouched] = useState({});
  const [editSensitive, setEditSensitive] = useState({});
  const theme = 'dark'; // Assuming a theme context is available or passed as a prop

  useEffect(() => {
    if (settings) {
      reset({
        stripe_public_key: settings.stripe_public_key || '',
        stripe_secret_key: settings.stripe_secret_key || '\u2022\u2022\u2022\u2022\u2022',
        jazzcash_merchant_id: settings.jazzcash_merchant_id || '',
        jazzcash_password: settings.jazzcash_password || '\u2022\u2022\u2022\u2022\u2022',
        easypaisa_token: settings.easypaisa_token || '\u2022\u2022\u2022\u2022\u2022',
        default_gateway: settings.default_gateway || 'stripe',
        payment_test_mode: settings.payment_test_mode || false,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data) => {
    const changed = {};
    for (const key of Object.keys(data)) {
      if (GATEWAY_FIELDS.find(f => f.name === key && f.sensitive)) {
        // Only send if changed and not masked
        if (data[key] !== '\u2022\u2022\u2022\u2022\u2022' && data[key] !== settings[key]) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {GATEWAY_FIELDS.map(field => (
        <div key={field.name} className="mb-6">
          {field.type === 'toggle' && field.name === 'payment_test_mode' ? (
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
              {field.type === 'select' ? (
                <MawaddahSelect
                  id={field.name}
                  options={field.options}
                  value={watch(field.name)}
                  onChange={val => {
                    const event = { target: { name: field.name, value: val } };
                    register(field.name).onChange(event);
                  }}
                  disabled={!canEdit}
                  placeholder={field.placeholder}
                  className="mb-2"
                />
              ) : (
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
              )}
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