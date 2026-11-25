'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button } from '@/lib/heroui';
import { Form, FormInput, FormErrorSummary } from '@/components/ui';
import WhatsAppIntegrationsPanel from '@/components/settings/WhatsAppIntegrationsPanel';
import { useGetWhatsAppWorkspaceQuery, useMutateWhatsAppWorkspaceMutation } from '@/redux/services/api';
import { whatsappConnectionSchema } from '@/lib/validation/whatsapp';

export default function ConnectionPanel({ canUpdate }) {
  const { data, error } = useGetWhatsAppWorkspaceQuery({ resource: 'coexistence' });
  const [mutate] = useMutateWhatsAppWorkspaceMutation();
  const [connecting, setConnecting] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const [message, setMessage] = useState('');
  const assets = useRef(null);
  const active = useRef(false);
  const methods = useForm({ resolver: zodResolver(whatsappConnectionSchema), defaultValues: { app_id: '', config_id: '' } });

  useEffect(() => {
    if (data) methods.reset({ app_id: data.app_id, config_id: data.config_id });
  }, [data, methods]);

  useEffect(() => {
    const listener = (event) => {
      // Accept only the exact Meta origins used by Embedded Signup.
      if (!active.current || !['https://www.facebook.com', 'https://web.facebook.com'].includes(event.origin)) return;
      let payload;
      try { payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
      if (payload?.type === 'WA_EMBEDDED_SIGNUP' && payload.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
        assets.current = payload.data;
      }
    };
    window.addEventListener('message', listener);
    return () => { active.current = false; window.removeEventListener('message', listener); };
  }, []);

  const save = async (values) => {
    try {
      await mutate({ resource: 'coexistence', method: 'PUT', body: values }).unwrap();
      setPrepared(null);
      setMessage('Embedded Signup settings saved.');
    } catch (e) { methods.setError('root', { message: getApiErrorMessage(e, 'Could not save setup') }); }
  };

  const loadFacebookSdk = () => new Promise((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }

    const scriptId = 'whatsapp-facebook-sdk';
    const existing = document.getElementById(scriptId);
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (window.fbAsyncInit === onReady) delete window.fbAsyncInit;
      if (error) reject(error);
      else resolve();
    };
    const onReady = () => {
      if (window.FB) finish();
      else finish(new Error('Facebook SDK loaded without exposing the FB object.'));
    };
    const timeout = window.setTimeout(() => finish(new Error(
      'Facebook SDK timed out. Check browser extensions, firewall rules, and allow connect.facebook.net.'
    )), 15000);
    window.fbAsyncInit = onReady;

    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => finish(new Error(
        'Facebook SDK was blocked. Allow https://connect.facebook.net/en_US/sdk.js in the browser or network policy.'
      )), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onload = onReady;
    script.onerror = () => finish(new Error(
      'Facebook SDK was blocked. Allow https://connect.facebook.net/en_US/sdk.js in the browser or network policy.'
    ));
    document.head.appendChild(script);
  });

  const prepare = async () => {
    setConnecting(true); setMessage(''); setPrepared(null);
    try {
      const session = await mutate({ resource: 'coexistence/sessions' }).unwrap();
      await loadFacebookSdk();
      window.FB.init({ appId: session.app_id, version: session.graph_version, xfbml: false, cookie: false });
      setPrepared(session);
      setMessage('Ready. Choose Connect Business app to open Meta signup.');
    } catch (e) { setMessage(getApiErrorMessage(e, 'Could not prepare Meta signup')); }
    finally { setConnecting(false); }
  };

  const connect = async () => {
    if (!prepared || !window.FB) return;
    const session = prepared;
    setConnecting(true); setMessage(''); assets.current = null;
    try {
      // Open synchronously from the user gesture so popup blockers do not suppress signup.
      active.current = true;
      const response = await new Promise((resolve) => window.FB.login(resolve, {
        config_id: session.config_id, response_type: 'code', override_default_response_type: true,
        extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' },
      }));
      const code = response?.authResponse?.code;
      if (!code) throw new Error('Signup was cancelled or Meta did not return an authorization code.');
      // The session logging event may arrive just after the login callback.
      for (let i = 0; i < 30 && !assets.current?.phone_number_id; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!assets.current?.phone_number_id || !assets.current?.waba_id) throw new Error('Meta did not return Business app phone details. Check your coexistence configuration.');
      const result = await mutate({ resource: 'coexistence/connections', body: {
        session_id: session.session_id, code, phone_number_id: assets.current.phone_number_id, waba_id: assets.current.waba_id,
      } }).unwrap();
      const syncOk = Object.values(result.sync_requested || {}).every(Boolean);
      setMessage(syncOk ? 'Business app connected. History and contact synchronization requested.' : 'Business app connected, but a sync request failed. Check Meta permissions and reconnect within the onboarding sync window.');
    } catch (e) { setMessage(getApiErrorMessage(e, 'Connection failed')); }
    finally { active.current = false; assets.current = null; setPrepared(null); setConnecting(false); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connect your existing WhatsApp Business app</h2>
        <p className="text-sm text-gray-600">Use an eligible Meta app and an Embedded Signup configuration supporting coexistence. Save the app secret in integration settings below. Meta account ownership, verification, permissions, and template approval must be completed in Meta.</p>
        <p className="text-sm">{data?.connected ? 'Connected through Embedded Signup' : 'Embedded Signup connection pending'}{data?.last_sync_at ? ` · Last sync event: ${new Date(`${data.last_sync_at}Z`).toLocaleString()}` : ''}</p>
        {error && <p role="alert" className="text-danger">Could not load connection settings.</p>}
        {!data?.has_app_secret && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Save the Meta App Secret in the WhatsApp integration settings below before preparing the connection.</p>}
        <Form methods={methods} onSubmit={save} className="space-y-4">
          <FormErrorSummary error={methods.formState.errors.root?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput name="app_id" label="Meta app ID" isDisabled={!canUpdate} />
            <FormInput name="config_id" label="Embedded Signup configuration ID" isDisabled={!canUpdate} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="flat" isDisabled={!canUpdate} isLoading={methods.formState.isSubmitting}>Save signup settings</Button>
            <Button variant="flat" onPress={prepare} isDisabled={!canUpdate || !data?.app_id || !data?.has_app_secret || connecting} isLoading={connecting && !prepared}>Prepare connection</Button>
            <Button color="primary" onPress={connect} isDisabled={!canUpdate || !prepared || connecting} isLoading={connecting && Boolean(prepared)}>Connect Business app</Button>
          </div>
        </Form>
        {message && <p role="status" className="rounded-lg bg-gray-50 p-3 text-sm">{message}</p>}
        <p className="text-sm text-gray-600">API campaigns send individual messages. Coexistence does not automate Status or Channels, and existing app broadcast lists become read-only. Replies and app-sent messages pause scheduled automation for that contact.</p>
      </section>
      <WhatsAppIntegrationsPanel />
    </div>
  );
}
