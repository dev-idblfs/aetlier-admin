'use client'

import { Divider, Chip } from '@heroui/react'
import { Calendar, Clock, User, Mail, Phone } from '@/lib/icons'
import { DetailRow } from '@/components/ui'
import ConsultationJoinCard from '@/components/consultation/ConsultationJoinCard'
import { useGetConsultationQuery } from '@/redux/services/api'
import { formatDate, formatTime } from '@/utils/dateFormatters'
import { isOnlineConsultation } from '@/utils/consultationJoinWindow'
import { STATUS_COLORS } from '../constants'
import {
  getDoctorName,
  getFeeLabel,
  getModeLabel,
  getPatientEmail,
  getPatientName,
  getPatientPhone,
  getServiceName,
} from '../utils'

function ConsultationJoinCardSection({ appointment }) {
  const { data: consultation } = useGetConsultationQuery(appointment.id, {
    skip: !appointment?.id,
  })

  return (
    <ConsultationJoinCard
      appointment={appointment}
      consultation={consultation}
      variant="detail"
    />
  )
}

/**
 * Shared appointment detail body for hub page (and optional modals).
 */
export default function AppointmentDetailBody({ appointment }) {
  if (!appointment) return null

  const patientName = getPatientName(appointment) || '—'
  const email = getPatientEmail(appointment)
  const phone = getPatientPhone(appointment)
  const fee = getFeeLabel(appointment)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          size="sm"
          color={STATUS_COLORS[appointment.status] || 'default'}
          variant="flat"
          className="capitalize"
        >
          {appointment.status?.replace('_', ' ')}
        </Chip>
        <Chip size="sm" variant="flat" color={appointment.consultation_mode === 'online' ? 'secondary' : 'default'}>
          {getModeLabel(appointment.consultation_mode)}
        </Chip>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Patient
        </h4>
        <div className="space-y-3">
          <DetailRow icon={<User className="h-4 w-4" />} label="Name" value={patientName} />
          {email ? (
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
          ) : null}
          {phone ? (
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={phone} />
          ) : null}
          {appointment.booked_for_other ? (
            <p className="text-xs text-gray-500">Booked for someone else</p>
          ) : null}
        </div>
      </div>

      <Divider />

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Visit
        </h4>
        <div className="space-y-3">
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date"
            value={formatDate(
              appointment.appointment_date || appointment.preferred_date
            )}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={formatTime(
              appointment.appointment_time || appointment.preferred_time
            )}
          />
          <DetailRow label="Service" value={getServiceName(appointment) || '—'} />
          <DetailRow label="Doctor" value={getDoctorName(appointment) || '—'} />
          <DetailRow
            label="Fee / payment"
            value={
              appointment.invoice_number
                ? `${appointment.invoice_number}${fee ? ` · ${fee}` : ''}${
                    appointment.invoice_status
                      ? ` · ${appointment.invoice_status}`
                      : ''
                  }`
                : fee
                  ? `${fee} · Pay at clinic`
                  : 'Pay at clinic'
            }
          />
        </div>
      </div>

      {appointment.special_notes ? (
        <>
          <Divider />
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Notes
            </h4>
            <p className="rounded-lg bg-gray-50 p-3 text-gray-700 whitespace-pre-wrap">
              {appointment.special_notes}
            </p>
          </div>
        </>
      ) : null}

      {isOnlineConsultation(appointment) ? (
        <>
          <Divider />
          <ConsultationJoinCardSection appointment={appointment} />
        </>
      ) : null}

      <div className="space-y-1 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <p>ID: {appointment.id}</p>
        {appointment.created_at ? (
          <p>
            Created{' '}
            {new Date(appointment.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
