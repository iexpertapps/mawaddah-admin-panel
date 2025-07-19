import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import { BanknotesIcon, DocumentIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

const DONATION_FIELDS = [
  { name: 'min_monthly_donation', label: 'Min Monthly Donation (PKR)', type: 'number' },
  { name: 'default_donation_amounts', label: 'Default Donation Amounts', type: 'array' },
  { name: 'donation_cutoff_day', label: 'Donation Cutoff Day (1-31)', type: 'number' },
  { name: 'auto_assign_donor_role', label: 'Auto-assign Donor Role', type: 'toggle' },
  { name: 'allow_anonymous_giving', label: 'Allow Anonymous Giving', type: 'toggle' },
];

export default function DonationSettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, control, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'default_donation_amounts',
  });

  useEffect(() => {
    if (settings) {
      reset({
        min_monthly_donation: settings.min_monthly_donation || 1000,
        default_donation_amounts: settings.default_donation_amounts || [500, 1000, 5000],
        donation_cutoff_day: settings.donation_cutoff_day || 1,
        auto_assign_donor_role: settings.auto_assign_donor_role || false,
        allow_anonymous_giving: settings.allow_anonymous_giving || false,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="min_monthly_donation" className="mb-2 block">Min Monthly Donation (PKR)</Label>
        <MawaddahInput
          id="min_monthly_donation"
          type="number"
          {...register('min_monthly_donation', { valueAsNumber: true })}
          disabled={!canEdit}
          placeholder="e.g. 1000"
          icon={<BanknotesIcon />}
          className="mb-2"
        />
      </div>
      <div>
        <Label className="mb-2 block">Default Donation Amounts</Label>
        <div className="flex flex-col gap-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2">
              <MawaddahInput
                type="number"
                min={1}
                step={1}
                {...register(`default_donation_amounts.${idx}`, {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Must be positive' },
                  validate: value => {
                    if (!Number.isInteger(value)) return 'No decimals allowed';
                    if (value <= 0) return 'Must be positive';
                    // Check for duplicates (ignore current index)
                    const values = watch('default_donation_amounts') || [];
                    return values.filter((v, i) => v === value && i !== idx).length === 0 || 'Duplicate amount';
                  },
                })}
                disabled={!canEdit}
                placeholder="e.g. 500"
                className="w-28"
              />
              {canEdit && fields.length > 1 && (
                <MawaddahButton
                  type="button"
                  onClick={() => remove(idx)}
                  className="flex items-center justify-center h-8 w-8 p-0 text-red-500 border border-red-200 bg-white rounded-md shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-300 -mt-1"
                  variant="add"
                  aria-label="Remove this amount"
                  title="Remove this amount"
                  disabled={fields.length === 1}
                >
                  &times;
                </MawaddahButton>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="flex justify-start mt-2">
              <MawaddahButton
                type="button"
                onClick={() => {
                  const values = watch('default_donation_amounts') || [];
                  // Only add if last field is filled and not duplicate
                  const last = values[values.length - 1];
                  if (!last || last <= 0 || !Number.isInteger(last)) return;
                  // Prevent duplicate
                  if (values.includes(0)) return;
                  append(0);
                }}
                variant="add"
                className="px-6 py-2 text-base font-semibold border border-[#1A7F55] bg-white text-[#1A7F55] shadow-lg hover:bg-[#F8F6F0] hover:text-[#176945] focus:ring-2 focus:ring-[#1A7F55] rounded-md flex items-center"
                aria-label="Add another default donation amount"
                title="Click to add another default donation amount"
              >
                <span className="mr-1 text-[#1A7F55]">➕</span> <span className="text-[#1A7F55]">Add Amount</span>
              </MawaddahButton>
            </div>
          )}
          {/* Validation error display for duplicates/invalids */}
          {formState.errors.default_donation_amounts && Array.isArray(formState.errors.default_donation_amounts) && (
            <div className="mt-1 space-y-1">
              {formState.errors.default_donation_amounts.map((err, i) => err && (
                <div key={i} className="text-xs text-red-500">{err.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="donation_cutoff_day" className="mb-2 block">Donation Cutoff Day (1-31)</Label>
        <MawaddahInput
          id="donation_cutoff_day"
          type="number"
          min={1}
          max={31}
          {...register('donation_cutoff_day', { valueAsNumber: true })}
          disabled={!canEdit}
          placeholder="e.g. 1"
          icon={<DocumentIcon />}
          className="mb-2"
        />
      </div>
      <div className="flex items-center mb-2 space-x-2">
        <Label htmlFor="auto_assign_donor_role" className="m-0">Auto-assign Donor Role</Label>
        <MawaddahSwitch
          id="auto_assign_donor_role"
          checked={!!watch('auto_assign_donor_role')}
          onChange={val => {
            const event = { target: { name: 'auto_assign_donor_role', value: val } };
            register('auto_assign_donor_role').onChange(event);
          }}
          disabled={!canEdit}
        />
      </div>
      <div className="flex items-center mb-2 space-x-2">
        <Label htmlFor="allow_anonymous_giving" className="m-0">Allow Anonymous Giving</Label>
        <MawaddahSwitch
          id="allow_anonymous_giving"
          checked={!!watch('allow_anonymous_giving')}
          onChange={val => {
            const event = { target: { name: 'allow_anonymous_giving', value: val } };
            register('allow_anonymous_giving').onChange(event);
          }}
          disabled={!canEdit}
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