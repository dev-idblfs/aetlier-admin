'use client'

/**
 * Settings → Developer — feature flags, API keys, outbound webhooks.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Switch, Input, Checkbox, CheckboxGroup } from '@heroui/react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui'
import {
  useGetOrganizationOnboardingQuery,
  useUpdateOrganizationFeatureFlagsMutation,
  useGetOrganizationApiKeysQuery,
  useCreateOrganizationApiKeyMutation,
  useRevokeOrganizationApiKeyMutation,
  useGetOrganizationWebhooksQuery,
  useCreateOrganizationWebhookMutation,
  useUpdateOrganizationWebhookMutation,
  useDeleteOrganizationWebhookMutation,
  useGetOrganizationWebhookDeliveriesQuery,
} from '@/redux/services/api'

const FLAG_META = [
  { key: 'public_catalog', label: 'Public catalog API', hint: 'Services & categories via API key' },
  { key: 'public_booking', label: 'Public booking API', hint: 'Create appointments with API key' },
  { key: 'booking_webhooks', label: 'Booking webhooks', hint: 'Outbound appointment event webhooks' },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Shared platform WhatsApp connection' },
  { key: 'livekit', label: 'LiveKit video', hint: 'Online consultation rooms' },
  { key: 'facescan', label: 'Face scan', hint: 'AI skin analysis' },
  { key: 'online_consultation', label: 'Online consultation', hint: 'Booking mode' },
  { key: 'referrals', label: 'Referrals', hint: 'Coins & referral program' },
]

const WEBHOOK_EVENTS = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
  'appointment.completed',
]

function SettingsCard({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 md:p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export default function DeveloperSettingsPanel() {
  const { user, activeOrganizationId, organizations } = useSelector((s) => s.auth)
  const orgId =
    activeOrganizationId ||
    user?.organization_id ||
    organizations?.[0]?.id ||
    null

  const canManage =
    user?.is_platform_admin ||
    Boolean(orgId)

  const { data: onboarding, refetch: refetchOnboarding } =
    useGetOrganizationOnboardingQuery(orgId, { skip: !orgId })
  const org = onboarding?.organization

  const [updateFlags, { isLoading: isSavingFlags }] =
    useUpdateOrganizationFeatureFlagsMutation()
  const { data: apiKeys = [], refetch: refetchKeys } = useGetOrganizationApiKeysQuery(orgId, {
    skip: !orgId,
  })
  const [createKey, { isLoading: isCreatingKey }] = useCreateOrganizationApiKeyMutation()
  const [revokeKey] = useRevokeOrganizationApiKeyMutation()
  const { data: webhooks = [], refetch: refetchWebhooks } = useGetOrganizationWebhooksQuery(
    orgId,
    { skip: !orgId }
  )
  const [createWebhook, { isLoading: isCreatingWebhook }] =
    useCreateOrganizationWebhookMutation()
  const [updateWebhook] = useUpdateOrganizationWebhookMutation()
  const [deleteWebhook] = useDeleteOrganizationWebhookMutation()

  const [flags, setFlags] = useState({})
  const [keyName, setKeyName] = useState('Default catalog key')
  const [newKey, setNewKey] = useState(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState(WEBHOOK_EVENTS)
  const [selectedWebhookId, setSelectedWebhookId] = useState(null)

  const { data: deliveries = [] } = useGetOrganizationWebhookDeliveriesQuery(
    { orgId, webhookId: selectedWebhookId },
    { skip: !orgId || !selectedWebhookId }
  )

  const authOrg = useMemo(
    () => (organizations || []).find((o) => o.id === orgId) || organizations?.[0],
    [organizations, orgId]
  )

  useEffect(() => {
    const source = org?.feature_flags || authOrg?.feature_flags || {}
    setFlags({
      whatsapp: !!source.whatsapp,
      livekit: !!source.livekit,
      facescan: !!source.facescan,
      online_consultation: !!source.online_consultation,
      referrals: !!source.referrals,
      public_catalog: !!source.public_catalog,
      public_booking: !!source.public_booking,
      booking_webhooks: !!source.booking_webhooks,
    })
  }, [org, authOrg])

  if (!canManage || !orgId) {
    return (
      <p className="text-sm text-gray-600 pt-4">
        Select an organization to manage developer settings.
      </p>
    )
  }

  const handleSaveFlags = async () => {
    try {
      await updateFlags({ id: orgId, ...flags }).unwrap()
      toast.success('Feature flags saved')
      refetchOnboarding()
    } catch (err) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.detail?.error?.message ||
          'Failed to save flags'
      )
    }
  }

  const handleCreateKey = async () => {
    try {
      const res = await createKey({
        id: orgId,
        name: keyName || 'API key',
        scopes: ['catalog:read', 'booking:write'],
      }).unwrap()
      setNewKey(res.api_key)
      toast.success('API key created — copy it now')
      refetchKeys()
    } catch (err) {
      toast.error('Failed to create API key')
    }
  }

  const handleRevokeKey = async (keyId) => {
    try {
      await revokeKey({ orgId, keyId }).unwrap()
      toast.success('API key revoked')
      refetchKeys()
    } catch (err) {
      toast.error('Failed to revoke key')
    }
  }

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Webhook URL is required')
      return
    }
    try {
      const res = await createWebhook({
        id: orgId,
        url: webhookUrl.trim(),
        events: webhookEvents,
        is_active: true,
      }).unwrap()
      toast.success('Webhook created')
      if (res.secret) {
        toast.success(`Signing secret: ${res.secret}`, { duration: 8000 })
      }
      setWebhookUrl('')
      refetchWebhooks()
    } catch (err) {
      toast.error('Failed to create webhook')
    }
  }

  return (
    <div className="pt-4 md:pt-6 space-y-4 md:space-y-6">
      <SettingsCard
        title="Feature flags"
        description="Enable partner surfaces and clinic modules for this organization."
      >
        <div className="space-y-2">
          {FLAG_META.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">{item.hint}</p>
              </div>
              <Switch
                isSelected={!!flags[item.key]}
                onValueChange={(v) => setFlags((f) => ({ ...f, [item.key]: v }))}
                aria-label={item.label}
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSaveFlags} isLoading={isSavingFlags} className="mt-2">
          Save flags
        </Button>
      </SettingsCard>

      <SettingsCard
        title="API keys"
        description="Use X-Api-Key on public catalog and booking endpoints. Raw key is shown once."
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            label="Key name"
            value={keyName}
            onValueChange={setKeyName}
            className="flex-1"
          />
          <Button onClick={handleCreateKey} isLoading={isCreatingKey} className="sm:self-end">
            Generate key
          </Button>
        </div>
        {newKey ? (
          <p className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm break-all">
            <span className="text-xs uppercase text-amber-800">Copy now</span>
            <br />
            <code>{newKey}</code>
          </p>
        ) : null}
        <ul className="space-y-2 text-sm">
          {(Array.isArray(apiKeys) ? apiKeys : apiKeys?.items || []).map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
            >
              <div>
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-gray-500">
                  {k.key_prefix}… · {k.is_active ? 'active' : 'revoked'}
                </p>
              </div>
              {k.is_active ? (
                <Button size="sm" variant="secondary" onClick={() => handleRevokeKey(k.id)}>
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Webhooks"
        description="Signed POSTs (X-Aetlier-Signature) for appointment lifecycle events."
      >
        <Input
          label="Endpoint URL"
          value={webhookUrl}
          onValueChange={setWebhookUrl}
          placeholder="https://example.com/hooks/aetlier"
        />
        <CheckboxGroup
          label="Events"
          value={webhookEvents}
          onValueChange={setWebhookEvents}
          orientation="horizontal"
          className="gap-2"
        >
          {WEBHOOK_EVENTS.map((ev) => (
            <Checkbox key={ev} value={ev} size="sm">
              {ev}
            </Checkbox>
          ))}
        </CheckboxGroup>
        <Button onClick={handleCreateWebhook} isLoading={isCreatingWebhook}>
          Add webhook
        </Button>
        <ul className="space-y-2 text-sm">
          {(Array.isArray(webhooks) ? webhooks : []).map((w) => (
            <li
              key={w.id}
              className="border border-gray-100 rounded-lg px-3 py-2 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{w.url}</p>
                  <p className="text-xs text-gray-500">
                    {(w.events || []).join(', ')} · {w.is_active ? 'active' : 'off'}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedWebhookId(w.id)}
                  >
                    Deliveries
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await updateWebhook({
                        orgId,
                        webhookId: w.id,
                        is_active: !w.is_active,
                      }).unwrap()
                      refetchWebhooks()
                    }}
                  >
                    {w.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await deleteWebhook({ orgId, webhookId: w.id }).unwrap()
                      refetchWebhooks()
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {selectedWebhookId ? (
          <div className="text-xs space-y-1 border-t border-gray-100 pt-2">
            <p className="font-medium text-gray-700">Recent deliveries</p>
            {(Array.isArray(deliveries) ? deliveries : []).slice(0, 10).map((d) => (
              <p key={d.id} className="text-gray-500">
                {d.created_at}: {d.event} · {d.status} · {d.http_code || '—'}
              </p>
            ))}
          </div>
        ) : null}
      </SettingsCard>
    </div>
  )
}
