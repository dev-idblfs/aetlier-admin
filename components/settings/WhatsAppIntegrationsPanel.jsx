'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Chip, Switch, Spinner } from '@heroui/react';
import { MessageCircle, Save, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  useGetWhatsAppIntegrationQuery,
  useUpdateWhatsAppIntegrationMutation,
  useTestWhatsAppIntegrationMutation,
} from '@/redux/services/api';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { whatsAppIntegrationSchema } from '@/lib/validation';
import { Form, FormErrorSummary, FormInput, DEFAULT_FORM_OPTIONS } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';

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

  const methods = useForm({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(whatsAppIntegrationSchema),
    defaultValues: {
      whatsapp_enabled: false,
      whatsapp_phone_number_id: '',
      whatsapp_business_account_id: '',
      whatsapp_access_token: '',
      whatsapp_verify_token: '',
      whatsapp_app_secret: '',
    },
  });

  const whatsappEnabled = methods.watch('whatsapp_enabled');

  useEffect(() => {
    if (data) {
      methods.reset({
        whatsapp_enabled: data.whatsapp_enabled ?? false,
        whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
        whatsapp_business_account_id: data.whatsapp_business_account_id || '',
        whatsapp_access_token: '',
        whatsapp_verify_token: '',
        whatsapp_app_secret: '',
      });
    }
  }, [data, methods]);

  const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
    fallbackMessage: 'Failed to save WhatsApp settings',
    onSubmit: async (values) => {
      if (!canUpdate) return;
      const payload = { ...values };
      if (!payload.whatsapp_access_token) delete payload.whatsapp_access_token;
      if (!payload.whatsapp_verify_token) delete payload.whatsapp_verify_token;
      if (!payload.whatsapp_app_secret) delete payload.whatsapp_app_secret;
      await updateIntegration(payload).unwrap();
      await refetch();
    },
    onSuccess: () => toast.success('WhatsApp settings saved'),
  });

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
    <Form methods={methods} onSubmit={handleSubmit} className="space-y-6 pt-4 md:pt-6">
      <FormErrorSummary error={methods.formState.errors.root?.message} />

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
          <Chip color={whatsappEnabled ? 'success' : 'default'} variant="flat">
            {whatsappEnabled ? 'Active' : 'Disabled'}
          </Chip>
        </div>
        <Switch
          isSelected={whatsappEnabled}
          isDisabled={!canUpdate}
          onValueChange={(v) => methods.setValue('whatsapp_enabled', v, { shouldValidate: true })}
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
          <FormInput
            name="whatsapp_phone_number_id"
            label="Phone number ID"
            isDisabled={!canUpdate}
          />
          <FormInput
            name="whatsapp_business_account_id"
            label="Business account ID (WABA)"
            isDisabled={!canUpdate}
          />
          <FormInput
            name="whatsapp_access_token"
            label="Access token"
            type="password"
            placeholder={data?.has_access_token ? data.whatsapp_access_token : 'Enter token'}
            isDisabled={!canUpdate}
          />
          <FormInput
            name="whatsapp_verify_token"
            label="Verify token"
            type="password"
            placeholder={data?.whatsapp_verify_token || 'Webhook verify token'}
            isDisabled={!canUpdate}
          />
          <FormInput
            name="whatsapp_app_secret"
            label="App secret"
            type="password"
            placeholder={data?.whatsapp_app_secret || 'Optional app secret'}
            isDisabled={!canUpdate}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            color="primary"
            startContent={<Save className="w-4 h-4" />}
            isLoading={saving || isSubmitting}
            isDisabled={!canUpdate}
          >
            Save integration
          </Button>
          <Button
            type="button"
            variant="bordered"
            startContent={<Zap className="w-4 h-4" />}
            isLoading={testing}
            isDisabled={
              !canUpdate ||
              !whatsappEnabled ||
              !data?.has_access_token ||
              !methods.getValues('whatsapp_phone_number_id')
            }
            onPress={handleTest}
          >
            Test connection
          </Button>
        </div>
      </div>
    </Form>
  );
}
