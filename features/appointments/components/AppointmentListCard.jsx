'use client'

import {
  Button,
  Chip,
  Card as HeroCard,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
  Checkbox,
} from '@/lib/heroui'
import { MoreVertical } from '@/lib/icons'
import { EntityLink, StatusBadge } from '@/components/ui'
import ConsultationJoinCard from '@/components/consultation/ConsultationJoinCard'
import { formatDate, formatTime } from '@/utils/dateFormatters'
import { isOnlineConsultation } from '@/utils/consultationJoinWindow'
import {
  getClinicName,
  getDoctorName,
  getPaymentSummary,
  shortAppointmentId,
} from '../utils'

/**
 * Mobile list card for appointments.
 */
export default function AppointmentListCard({
  appointment,
  actions = [],
  selectable = false,
  isSelected = false,
  onSelect,
}) {
  const apt = appointment
  const canSelect = selectable && apt.status !== 'cancelled'
  const patientId = apt.user_id || apt.user?.id
  const doctorId = apt.doctor_id || apt.doctor?.id || apt.doctor_user_id
  const clinicName = getClinicName(apt)

  return (
    <HeroCard className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-3">
          {canSelect ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                isSelected={isSelected}
                onValueChange={onSelect}
                aria-label={`Select appointment ${apt.id}`}
              />
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <EntityLink href={patientId ? `/users/${patientId}/edit` : null}>
                {apt.patient_info?.full_name || apt.user?.name || 'N/A'}
              </EntityLink>
              <StatusBadge status={apt.status} />
              {apt.consultation_mode === 'online' ? (
                <Chip size="sm" color="secondary" variant="flat">
                  Online
                </Chip>
              ) : null}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              {shortAppointmentId(apt.id)}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {apt.patient_info?.email || apt.user?.email}
            </p>
          </div>
          {actions.length > 0 ? (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="light" isIconOnly size="sm" aria-label="More actions">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                {actions.map((action, index) => (
                  <DropdownItem
                    key={action.key || index}
                    color={action.color || (action.danger ? 'danger' : 'default')}
                    className={
                      action.danger || action.color === 'danger' ? 'text-danger' : undefined
                    }
                    startContent={action.icon}
                    onPress={() => action.onClick?.()}
                  >
                    {action.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          ) : null}
        </div>

        <Divider className="my-3" />

        {isOnlineConsultation(apt) ? (
          <div className="mb-3">
            <ConsultationJoinCard appointment={apt} variant="compact" />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Service</p>
            <p className="font-medium text-gray-900 truncate">
              {apt.service_name || apt.service?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Doctor</p>
            <EntityLink href={doctorId ? `/doctors/${doctorId}/edit` : null}>
              {getDoctorName(apt) || '—'}
            </EntityLink>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {formatDate(apt.appointment_date || apt.preferred_date)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium text-gray-900">
              {formatTime(apt.appointment_time || apt.preferred_time)}
            </p>
          </div>
          {clinicName ? (
            <div>
              <p className="text-gray-500">Clinic</p>
              <p className="font-medium text-gray-900 truncate">{clinicName}</p>
            </div>
          ) : null}
          {apt.patient_info?.phone ? (
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{apt.patient_info.phone}</p>
            </div>
          ) : null}
          <div className="col-span-2">
            <p className="text-gray-500">Payment</p>
            <p className="font-medium text-gray-900">{getPaymentSummary(apt)}</p>
          </div>
        </div>
      </CardBody>
    </HeroCard>
  )
}
