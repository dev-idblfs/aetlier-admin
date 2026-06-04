'use client';

import { useEffect, useState } from 'react';
import { Button, Chip, Input, Switch, Spinner } from '@heroui/react';
import { MessageCircle, Save, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  useGetWhatsAppIntegrationQuery,
  useUpdateWhatsAppIntegrationMutation,
  useTestWhatsAppIntegrationMutation,
} from '@/redux/services/api';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

export default function WhatsAppIntegrationsPanel() {
  const user = useSelector((s) => s.auth.user);
  const canRead = hasPermission(user, PERMISSIONS.INTEGRATIONS_WHATSAPP_READ);
  const canUpdate = hasPermission(user, PERMISSIONS.INTEGRATIONS_WHATSAPP_UPDATE);

  const { data, isLoading, refetch } = useGetWhatsAppIntegrationQuery(undefined, {
    skip: !canRead,
  });
  const [updateIntegration, { isLoading: saving }] =
    useUpdateWhatsAppIntegrationMutation();
  const [testConnection, { isLoading: testing }] =
    useTestWhatsAppIntegrationMutation();

  const [form, setForm] = useState({
    whatsapp_enabled: false,
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    whatsapp_access_token: '',
    whatsapp_verify_token: '',
    whatsapp_app_secret: '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        whatsapp_enabled: data.whatsapp_enabled ?? false,
        whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
        whatsapp_business_account_id: data.whatsapp_business_account_id || '',
        whatsapp_access_token: '',
        whatsapp_verify_token: '',
        whatsapp_app_secret: '',
      });
    }
  }, [data]);

  if (!canRead) {
    return (
      <p className="text-sm text-gray-600 py-6">
        You do not have permission to view WhatsApp integration settings.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const handleSave = async () => {
    if (!canUpdate) return;
    try {
      const payload = { ...form };
      if (!payload.whatsapp_access_token) delete payload.whatsapp_access_token;
      if (!payload.whatsapp_verify_token) delete payload.whatsapp_verify_token;
      if (!payload.whatsapp_app_secret) delete payload.whatsapp_app_secret;
      await updateIntegration(payload).unwrap();
      await refetch();
      toast.success('WhatsApp settings saved');
    } catch (e) {
      toast.error(e?.data?.detail || 'Failed to save WhatsApp settings');
    }
  };

  const handleTest = async () => {
    try {
      const res = await testConnection().unwrap();
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    } catch (e) {
      toast.error(e?.data?.detail || 'Connection test failed');
    }
  };

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Enable WhatsApp notifications
              </h3>
              <p className="text-sm text-gray-600 max-w-xl">
                When disabled, no WhatsApp messages are sent platform-wide
                (appointments, reminders, billing). User opt-in preferences are
                kept but inactive.
              </p>
            </div>
          </div>
          <Chip
            color={form.whatsapp_enabled ? 'success' : 'default'}
            variant="flat"
          >
            {form.whatsapp_enabled ? 'Active' : 'Disabled'}
          </Chip>
        </div>
        <Switch
          isSelected={form.whatsapp_enabled}
          isDisabled={!canUpdate}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, whatsapp_enabled: v }))
          }
        >
          WhatsApp notifications enabled
        </Switch>
        {data?.whatsapp_enabled_source && (
          <p className="text-xs text-gray-500">
            Source: {data.whatsapp_enabled_source}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Meta credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone number ID"
            value={form.whatsapp_phone_number_id}
            isDisabled={!canUpdate}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, whatsapp_phone_number_id: v }))
            }
          />
          <Input
            label="Business account ID (WABA)"
            value={form.whatsapp_business_account_id}
            isDisabled={!canUpdate}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, whatsapp_business_account_id: v }))
            }
          />
          <Input
            label="Access token"
            type="password"
            placeholder={data?.has_access_token ? data.whatsapp_access_token : 'Enter token'}
            isDisabled={!canUpdate}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, whatsapp_access_token: v }))
            }
          />
          <Input
            label="Verify token"
            type="password"
            placeholder={data?.whatsapp_verify_token || 'Webhook verify token'}
            isDisabled={!canUpdate}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, whatsapp_verify_token: v }))
            }
          />
          <Input
            label="App secret"
            type="password"
            placeholder={data?.whatsapp_app_secret || 'Optional app secret'}
            isDisabled={!canUpdate}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, whatsapp_app_secret: v }))
            }
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            color="primary"
            startContent={<Save className="w-4 h-4" />}
            isLoading={saving}
            isDisabled={!canUpdate}
            onPress={handleSave}
          >
            Save integration
          </Button>
          <Button
            variant="bordered"
            startContent={<Zap className="w-4 h-4" />}
            isLoading={testing}
            isDisabled={
              !canUpdate ||
              !form.whatsapp_enabled ||
              !data?.has_access_token ||
              !form.whatsapp_phone_number_id
            }
            onPress={handleTest}
          >
            Test connection
          </Button>
        </div>
      </div>
    </div>
  );
}
