import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSettings } from '../../../hooks/useSettings';
import { MawaddahInput, MawaddahSwitch, MawaddahButton } from '../../../components/atoms/mawaddah';
import { DocumentIcon } from '../../../components/atoms/Icons';
import { Label } from '../../../components/atoms/typography/Label';

export default function AuditLogSettings({ canEdit }) {
  const { settings, isLoading, isError, error, updateSettings, isUpdating, updateError } = useSettings();
  const { register, handleSubmit, reset, formState, watch } = useForm({
    mode: 'onChange',
    defaultValues: {},
  });
  const theme = 'admin';
  const watchedFields = watch();

  useEffect(() => {
    if (settings) {
      reset({
        enable_audit_logs: settings.enable_audit_logs || false,
        log_retention_days: settings.log_retention_days || 90,
        notify_on_setting_change: settings.notify_on_setting_change || false,
      });
    }
  }, [settings, reset]);

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
      <div className="flex items-center mb-2 space-x-2">
        <Label htmlFor="enable_audit_logs">Enable Audit Logs</Label>
        <MawaddahSwitch
          id="enable_audit_logs"
          checked={!!watchedFields.enable_audit_logs}
          onChange={val => {
            const event = { target: { name: 'enable_audit_logs', value: val } };
            register('enable_audit_logs').onChange(event);
          }}
          disabled={!canEdit}
        />
      </div>
      <div>
        <Label htmlFor="log_retention_days" className="mb-2 block">Log Retention Days</Label>
        <MawaddahInput
          id="log_retention_days"
          type="number"
          {...register('log_retention_days', { valueAsNumber: true })}
          disabled={!canEdit}
          placeholder="e.g. 90"
          value={watchedFields.log_retention_days}
          isDirty={formState.dirtyFields.log_retention_days}
          icon={<DocumentIcon />}
          className="mb-2"
        />
      </div>
      <div className="flex items-center mb-2 space-x-2">
        <Label htmlFor="notify_on_setting_change">Notify on Setting Change</Label>
        <MawaddahSwitch
          id="notify_on_setting_change"
          checked={!!watchedFields.notify_on_setting_change}
          onChange={val => {
            const event = { target: { name: 'notify_on_setting_change', value: val } };
            register('notify_on_setting_change').onChange(event);
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