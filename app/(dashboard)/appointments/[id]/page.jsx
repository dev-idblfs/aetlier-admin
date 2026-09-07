'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  Button,
  Spinner,
  Card as HeroCard,
  CardBody,
  useDisclosure,
} from '@/lib/heroui'
import { toast } from 'react-hot-toast'
import {
  Edit,
  FileText,
  FileCheck,
  CheckCircle,
  XCircle,
  BadgeCheck,
  User,
  Calendar,
} from '@/lib/icons'
import { FormPageLayout, ConfirmModal } from '@/components/ui'
import AccessDenied from '@/components/AccessDenied'
import AppointmentDetailBody from '@/features/appointments/components/AppointmentDetailBody'
import ConsultationJoinButton from '@/components/consultation/ConsultationJoinButton'
import {
  useGetAppointmentQuery,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
  useCompleteAppointmentMutation,
} from '@/redux/services/api'
import {
  hasAnyPermission,
  hasAllPermissions,
  PERMISSIONS,
  canReadAppointments,
} from '@/utils/permissions'
import { withUserPermissions } from '@/utils/navAccess'
import {
  getPatientName,
  getServiceName,
} from '@/features/appointments/utils'
import { isOnlineConsultation } from '@/utils/consultationJoinWindow'

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.id
  const { user, permissions } = useSelector((state) => state.auth)
  const authUser = withUserPermissions(user, permissions)

  const canView = canReadAppointments(authUser)
  const canEdit = hasAnyPermission(authUser, [
    PERMISSIONS.APPOINTMENT_UPDATE_ANY,
    PERMISSIONS.APPOINTMENT_UPDATE_OWN,
  ])
  const canDelete = hasAnyPermission(authUser, [
    PERMISSIONS.APPOINTMENT_DELETE_ANY,
    PERMISSIONS.APPOINTMENT_CANCEL,
  ])
  const canChangeStatus = hasAnyPermission(authUser, [
    PERMISSIONS.APPOINTMENT_APPROVE,
    PERMISSIONS.APPOINTMENT_UPDATE_ANY,
    PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
    PERMISSIONS.APPOINTMENT_CHANGE_STATUS_ASSIGNED,
  ])
  const canGenerateInvoice = hasAnyPermission(authUser, [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ_ANY,
  ])
  const canComplete = hasAllPermissions(authUser, [
    PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
    PERMISSIONS.INVOICE_CREATE,
  ])
  const canPrescribe = hasAnyPermission(authUser, [
    PERMISSIONS.PRESCRIPTION_CREATE_OWN,
    PERMISSIONS.PRESCRIPTION_READ_ANY,
  ])

  const { data: appointment, isLoading, refetch } = useGetAppointmentQuery(
    appointmentId,
    { skip: !canView || !appointmentId }
  )
  const [updateAppointment, { isLoading: isUpdating }] =
    useUpdateAppointmentMutation()
  const [deleteAppointment, { isLoading: isDeleting }] =
    useDeleteAppointmentMutation()
  const [completeAppointment, { isLoading: isCompleting }] =
    useCompleteAppointmentMutation()

  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onOpenChange: onCancelOpenChange } = useDisclosure()
  const { isOpen: isCompleteOpen, onOpen: onCompleteOpen, onOpenChange: onCompleteOpenChange } = useDisclosure()

  if (!canView) {
    return (
      <AccessDenied
        title="Access denied"
        message="You need appointment read permission to open this page."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="mb-4 text-gray-600">Appointment not found</p>
        <Button onPress={() => router.push('/appointments')}>Back to list</Button>
      </div>
    )
  }

  const patientName = getPatientName(appointment) || 'Appointment'
  const serviceName = getServiceName(appointment)
  const patientId = appointment.user_id || appointment.user?.id
  const isOnline = isOnlineConsultation(appointment)

  const handleConfirm = async () => {
    try {
      await updateAppointment({ id: appointmentId, status: 'confirmed' }).unwrap()
      toast.success('Appointment confirmed')
      refetch()
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to confirm')
    }
  }

  const handleComplete = async () => {
    if (appointment.invoice_id) {
      router.push(`/finance/invoices/${appointment.invoice_id}`)
      return
    }
    onCompleteOpen()
  }

  const handleCompleteConfirm = async () => {
    try {
      const result = await completeAppointment({ id: appointmentId }).unwrap()
      toast.success('Completed — draft invoice created')
      onCompleteOpenChange(false)
      if (result?.invoice?.id) {
        router.push(`/finance/invoices/${result.invoice.id}`)
      } else {
        refetch()
      }
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to complete')
    }
  }

  const handleCancelConfirm = async () => {
    try {
      await deleteAppointment({
        id: appointmentId,
        reason: 'Cancelled from admin detail',
      }).unwrap()
      toast.success('Appointment cancelled')
      onCancelOpenChange(false)
      router.push('/appointments')
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to cancel')
    }
  }

  return (
    <FormPageLayout
      title={patientName}
      breadcrumbs={[
        { label: 'Appointments', href: '/appointments' },
        { label: serviceName || 'Detail' },
      ]}
      cancelHref="/appointments"
    >
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Primary actions
        </p>
        <div className="flex flex-wrap gap-2">
          {isOnline ? (
            <ConsultationJoinButton appointment={appointment} size="md" />
          ) : null}
          {patientId ? (
            <Button
              size="sm"
              variant="flat"
              startContent={<User className="h-4 w-4" />}
              onPress={() => router.push(`/users/${patientId}/edit`)}
            >
              View patient
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Calendar className="h-4 w-4" />}
              onPress={() =>
                router.push(`/appointments/${appointmentId}/edit#schedule`)
              }
            >
              Reschedule
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              size="sm"
              variant="bordered"
              startContent={<Edit className="h-4 w-4" />}
              onPress={() => router.push(`/appointments/${appointmentId}/edit`)}
            >
              Update
            </Button>
          ) : null}
          {canChangeStatus && appointment.status === 'pending' ? (
            <Button
              size="sm"
              color="success"
              variant="flat"
              startContent={<BadgeCheck className="h-4 w-4" />}
              isLoading={isUpdating}
              onPress={handleConfirm}
            >
              Confirm
            </Button>
          ) : null}
          {canComplete && appointment.status === 'confirmed' ? (
            <Button
              size="sm"
              color="success"
              variant="flat"
              startContent={<CheckCircle className="h-4 w-4" />}
              isLoading={isCompleting}
              onPress={handleComplete}
            >
              Complete & invoice
            </Button>
          ) : null}
          {canPrescribe && appointment.status === 'completed' ? (
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              startContent={<FileCheck className="h-4 w-4" />}
              onPress={() =>
                router.push(`/appointments/${appointmentId}/edit?prescribe=1`)
              }
            >
              Prescription
            </Button>
          ) : null}
          {canGenerateInvoice &&
          appointment.status === 'completed' &&
          !appointment.invoice_id ? (
            <Button
              size="sm"
              variant="flat"
              startContent={<FileText className="h-4 w-4" />}
              onPress={() =>
                router.push(
                  `/finance/invoices/new?appointment_id=${appointmentId}`
                )
              }
            >
              Invoice
            </Button>
          ) : null}
          {appointment.invoice_id ? (
            <Button
              size="sm"
              variant="flat"
              startContent={<FileText className="h-4 w-4" />}
              onPress={() =>
                router.push(`/finance/invoices/${appointment.invoice_id}`)
              }
            >
              View invoice
            </Button>
          ) : null}
          {canDelete && appointment.status !== 'cancelled' ? (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<XCircle className="h-4 w-4" />}
              onPress={onCancelOpen}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HeroCard className="lg:col-span-2">
          <CardBody className="p-4 md:p-6">
            <AppointmentDetailBody appointment={appointment} />
          </CardBody>
        </HeroCard>

        <HeroCard>
          <CardBody className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-gray-800">More</h3>
            {canPrescribe ? (
              <Button
                fullWidth
                variant="bordered"
                color="secondary"
                startContent={<FileCheck className="h-4 w-4" />}
                onPress={() =>
                  router.push(
                    `/appointments/${appointmentId}/edit?prescribe=1`
                  )
                }
              >
                Prescription workspace
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                fullWidth
                variant="bordered"
                startContent={<Edit className="h-4 w-4" />}
                onPress={() =>
                  router.push(`/appointments/${appointmentId}/edit`)
                }
              >
                Full edit
              </Button>
            ) : null}
            {canDelete && appointment.status !== 'cancelled' ? (
              <Button
                fullWidth
                color="danger"
                variant="flat"
                startContent={<XCircle className="h-4 w-4" />}
                onPress={onCancelOpen}
              >
                Cancel appointment
              </Button>
            ) : null}
          </CardBody>
        </HeroCard>
      </div>

      <ConfirmModal
        isOpen={isCancelOpen}
        onOpenChange={onCancelOpenChange}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment"
        message={`Cancel this appointment for ${patientName}?`}
        confirmLabel="Cancel Appointment"
        type="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={isCompleteOpen}
        onOpenChange={onCompleteOpenChange}
        onConfirm={handleCompleteConfirm}
        title="Complete Appointment"
        message="Complete this appointment and create a draft invoice?"
        confirmLabel="Complete & Invoice"
        type="success"
        isLoading={isCompleting}
      />
    </FormPageLayout>
  )
}
