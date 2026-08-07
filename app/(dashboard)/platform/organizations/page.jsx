'use client'

/**
 * Platform Organizations — list and manage SaaS client orgs.
 */

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Switch } from '@heroui/react'
import { PageHeader, Button, DataTable, LinkButton } from '@/components/ui'
import { useSidebar } from '@/components/layout/AdminLayout'
import {
  useGetOrganizationsQuery,
  useUpdateOrganizationMutation,
} from '@/redux/services/api'
import { hasPermission, isSuperAdmin } from '@/utils/permissions'
import { ORG_FEATURE_KEYS } from '@/utils/organizationFeatures'

export default function PlatformOrganizationsPage() {
  const { setPageTitle, setBreadcrumbs } = useSidebar()
  const user = useSelector((s) => s.auth.user)
  const canManage =
    isSuperAdmin(user) ||
    user?.is_platform_admin ||
    hasPermission(user, 'organizations.read.any')
  const canUpdate =
    isSuperAdmin(user) ||
    user?.is_platform_admin ||
    hasPermission(user, 'organizations.update.any')

  const { data, isLoading, refetch } = useGetOrganizationsQuery(
    {},
    { skip: !canManage }
  )
  const [updateOrg] = useUpdateOrganizationMutation()
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    setPageTitle('Organizations')
    setBreadcrumbs([
      { label: 'Platform', href: '/platform/organizations' },
      { label: 'Organizations' },
    ])
  }, [setPageTitle, setBreadcrumbs])

  const handleStatus = async (id, status) => {
    try {
      await updateOrg({ id, status }).unwrap()
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleFlagToggle = async (org, key, value) => {
    if (!canUpdate) return
    const next = { ...(org.feature_flags || {}), [key]: value }
    try {
      await updateOrg({ id: org.id, feature_flags: next }).unwrap()
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          Platform administrator access is required to manage organizations.
        </p>
      </div>
    )
  }

  const items = data?.items || []

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Organizations"
        description="Onboard and manage SaaS client organizations"
        actions={
          <LinkButton href="/platform/organizations/new" aria-label="Onboard organization">
            Onboard organization
          </LinkButton>
        }
      />

      <DataTable
        isLoading={isLoading}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status' },
          { key: 'onboarding', label: 'Onboarding' },
          { key: 'features', label: 'Features' },
          { key: 'owner_email', label: 'Owner' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => row.actions,
          },
        ]}
        data={items.map((org) => {
          const flags = org.feature_flags || {}
          const enabled = ORG_FEATURE_KEYS.filter((f) => flags[f.key]).map(
            (f) => f.label
          )
          return {
            id: org.id,
            name: org.display_name || org.name,
            slug: org.slug,
            status: org.status,
            onboarding: org.onboarding_status || '—',
            features: enabled.length ? enabled.join(', ') : 'Core only',
            owner_email: org.owner_email || '—',
            actions: (
              <div className="flex flex-col gap-2 items-start">
                <div className="flex gap-2 flex-wrap">
                  {org.status !== 'suspended' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatus(org.id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatus(org.id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                  {canUpdate ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpandedId(expandedId === org.id ? null : org.id)
                      }
                    >
                      {expandedId === org.id ? 'Hide flags' : 'Flags'}
                    </Button>
                  ) : null}
                </div>
                {expandedId === org.id ? (
                  <div className="rounded-lg border border-gray-100 p-2 space-y-2 min-w-[220px]">
                    {ORG_FEATURE_KEYS.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span>{label}</span>
                        <Switch
                          size="sm"
                          isSelected={Boolean(flags[key])}
                          onValueChange={(v) => handleFlagToggle(org, key, v)}
                          aria-label={`Toggle ${label}`}
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400">
                      Uses shared platform connections
                    </p>
                  </div>
                ) : null}
              </div>
            ),
          }
        })}
      />
    </div>
  )
}
