'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Input, Textarea, Spinner, Select, SelectItem } from '@heroui/react'
import { toast } from 'react-hot-toast'
import { FileText, Plus, Save, Send, Trash2 } from '@/lib/icons'
import {
  useCreatePrescriptionMutation,
  useGetAppointmentPrescriptionsQuery,
  useSendPrescriptionMutation,
  useUpdateAppointmentMutation,
  useUpdatePrescriptionMutation,
} from '@/redux/services/api'
import { hasAnyPermission, hasPermission, PERMISSIONS } from '@/utils/permissions'

const MEAL_OPTIONS = [
  { key: '', label: 'Any / not specified' },
  { key: 'before_food', label: 'Before food' },
  { key: 'after_food', label: 'After food' },
  { key: 'with_food', label: 'With food' },
]

const FREQ_CHIPS = [
  'Morning - 1 Tab',
  'Afternoon - 1 Tab',
  'Evening - 1 Tab',
  'Night - 1 Tab',
]

const emptyItem = () => ({
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
  meal_timing: '',
})

function pickActivePrescription(list) {
  if (!Array.isArray(list) || list.length === 0) return null
  const draft = list.find((rx) => rx.status === 'draft')
  if (draft) return draft
  const sent = list.find((rx) => rx.status === 'sent')
  return sent || list[0]
}

function linesToText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('\n')
  return value || ''
}

function textToLines(value) {
  return String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function PrescriptionPanel({
  appointmentId,
  appointmentStatus,
  doctorUserId,
  autoFocus = false,
}) {
  const user = useSelector((s) => s.auth.user)
  const canCreate = hasPermission(user, PERMISSIONS.PRESCRIPTION_CREATE_OWN)
  const canSend = hasPermission(user, PERMISSIONS.PRESCRIPTION_SEND_OWN)
  const canReadAny = hasPermission(user, PERMISSIONS.PRESCRIPTION_READ_ANY)
  const canChangeStatus = hasAnyPermission(user, [
    PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
    PERMISSIONS.APPOINTMENT_CHANGE_STATUS_ASSIGNED,
  ])
  const canPrescribeHere = canCreate || canReadAny

  const { data: prescriptions, isLoading } = useGetAppointmentPrescriptionsQuery(
    appointmentId,
    { skip: !appointmentId || !canPrescribeHere }
  )
  const [createPrescription, { isLoading: isCreating }] = useCreatePrescriptionMutation()
  const [updatePrescription, { isLoading: isUpdating }] = useUpdatePrescriptionMutation()
  const [sendPrescription, { isLoading: isSending }] = useSendPrescriptionMutation()
  const [updateAppointment, { isLoading: isCompleting }] = useUpdateAppointmentMutation()
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [investigations, setInvestigations] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [locallyCompleted, setLocallyCompleted] = useState(false)

  const activeRx = useMemo(() => pickActivePrescription(prescriptions), [prescriptions])
  const isSent = activeRx?.status === 'sent'
  const isCompleted =
    locallyCompleted || String(appointmentStatus || '').toLowerCase() === 'completed'

  useEffect(() => {
    if (!activeRx) {
      setDiagnosis('')
      setSymptoms('')
      setMedicalHistory('')
      setInvestigations('')
      setAdvice('')
      setFollowUp('')
      setNotes('')
      setItems([emptyItem()])
      return
    }
    setDiagnosis(activeRx.diagnosis || '')
    setSymptoms(activeRx.symptoms || '')
    setMedicalHistory(activeRx.medical_history || '')
    setInvestigations(linesToText(activeRx.investigations))
    setAdvice(linesToText(activeRx.advice))
    setFollowUp(activeRx.follow_up || '')
    setNotes(activeRx.notes || '')
    setItems(
      activeRx.items?.length
        ? activeRx.items.map((item) => ({
            medicine_name: item.medicine_name || '',
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
            instructions: item.instructions || '',
            meal_timing: item.meal_timing || '',
          }))
        : [emptyItem()]
    )
  }, [activeRx])

  if (!canPrescribeHere) {
    return (
      <div
        id={autoFocus ? 'prescribe-panel' : undefined}
        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
      >
        <h3 className="text-sm font-semibold text-gray-900">E-Prescription</h3>
        <p className="mt-1 text-sm text-gray-600">
          {!canCreate
            ? 'Your account does not have permission to write prescriptions.'
            : 'Only the assigned doctor can write a prescription for this appointment.'}
        </p>
      </div>
    )
  }

  const handleComplete = async () => {
    try {
      await updateAppointment({ id: appointmentId, status: 'completed' }).unwrap()
      setLocallyCompleted(true)
      toast.success('Consultation marked complete')
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to complete appointment')
    }
  }

  const buildPayload = () => {
    const cleaned = items
      .map((item) => ({
        medicine_name: item.medicine_name.trim(),
        dosage: item.dosage.trim() || null,
        frequency: item.frequency.trim() || null,
        duration: item.duration.trim() || null,
        instructions: item.instructions.trim() || null,
        meal_timing: item.meal_timing || null,
      }))
      .filter((item) => item.medicine_name)
    return {
      diagnosis: diagnosis.trim(),
      symptoms: symptoms.trim() || null,
      medical_history: medicalHistory.trim() || null,
      investigations: textToLines(investigations),
      advice: textToLines(advice),
      follow_up: followUp.trim() || null,
      notes: notes.trim() || null,
      items: cleaned,
    }
  }

  const validate = (payload) => {
    if (!payload.diagnosis) {
      toast.error('Diagnosis is required')
      return false
    }
    if (!payload.items.length) {
      toast.error('Add at least one medicine')
      return false
    }
    if (activeRx && !activeRx.patient_age_snapshot && !activeRx.patient_gender_snapshot) {
      toast.error(
        'Patient age/gender missing on this visit — update patient demographics before sending'
      )
      return false
    }
    return true
  }

  const handleSaveDraft = async () => {
    const payload = buildPayload()
    if (!validate(payload)) return
    try {
      if (activeRx?.id && activeRx.status === 'draft') {
        await updatePrescription({
          prescriptionId: activeRx.id,
          appointmentId,
          ...payload,
        }).unwrap()
      } else {
        await createPrescription({ appointmentId, ...payload }).unwrap()
      }
      toast.success('Draft prescription saved')
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to save prescription')
    }
  }

  const handleSend = async () => {
    if (!canSend) {
      toast.error('You do not have permission to send prescriptions')
      return
    }
    const payload = buildPayload()
    if (!validate(payload)) return
    try {
      let rxId = activeRx?.id
      if (activeRx?.status === 'draft' && rxId) {
        await updatePrescription({
          prescriptionId: rxId,
          appointmentId,
          ...payload,
        }).unwrap()
      } else if (!rxId || activeRx?.status === 'sent') {
        const created = await createPrescription({ appointmentId, ...payload }).unwrap()
        rxId = created?.id
      }
      if (!rxId) throw new Error('Missing prescription id')
      await sendPrescription({ prescriptionId: rxId, appointmentId }).unwrap()
      toast.success('Prescription sent to patient')
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to send prescription')
    }
  }

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const appendFrequencyChip = (index, chip) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const existing = (item.frequency || '').trim()
        if (existing.includes(chip)) return item
        return {
          ...item,
          frequency: existing ? `${existing} | ${chip}` : chip,
        }
      })
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (!isCompleted) {
    return (
      <div
        id={autoFocus ? 'prescribe-panel' : undefined}
        className="rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <h3 className="text-sm font-semibold text-amber-900">E-Prescription</h3>
        <p className="mt-1 text-sm text-amber-800">
          Mark the consultation complete before writing a prescription.
        </p>
        {canChangeStatus && (
          <Button
            className="mt-3"
            color="warning"
            variant="flat"
            isLoading={isCompleting}
            onPress={handleComplete}
          >
            Complete consultation
          </Button>
        )}
      </div>
    )
  }

  const demographicsStrip = activeRx ? (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
      <span className="font-medium text-gray-800">
        {activeRx.patient_name_snapshot || 'Patient'}
      </span>
      {[
        activeRx.patient_age_snapshot ? `Age ${activeRx.patient_age_snapshot}` : null,
        activeRx.patient_gender_snapshot,
        activeRx.patient_city_snapshot,
        activeRx.patient_phone_snapshot,
      ]
        .filter(Boolean)
        .map((part) => (
          <span key={part}> · {part}</span>
        ))}
    </div>
  ) : null

  if (isSent) {
    return (
      <div
        id={autoFocus ? 'prescribe-panel' : undefined}
        className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">E-Prescription</h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Sent
          </span>
        </div>
        {demographicsStrip}
        {activeRx.symptoms && (
          <div>
            <p className="text-xs text-gray-500">Symptoms</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{activeRx.symptoms}</p>
          </div>
        )}
        {activeRx.medical_history && (
          <div>
            <p className="text-xs text-gray-500">History</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{activeRx.medical_history}</p>
          </div>
        )}
        {activeRx.diagnosis && (
          <div>
            <p className="text-xs text-gray-500">Diagnosis</p>
            <p className="text-sm text-gray-900">{activeRx.diagnosis}</p>
          </div>
        )}
        {activeRx.notes && (
          <div>
            <p className="text-xs text-gray-500">Notes</p>
            <p className="text-sm text-gray-700">{activeRx.notes}</p>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Medicines</p>
          {(activeRx.items || []).map((item) => (
            <div
              key={item.id || item.medicine_name}
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            >
              <p className="font-medium text-gray-900">{item.medicine_name}</p>
              <p className="text-gray-600">
                {[item.dosage, item.frequency, item.duration, item.meal_timing]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {item.instructions && (
                <p className="text-xs text-gray-500 mt-0.5">{item.instructions}</p>
              )}
            </div>
          ))}
        </div>
        {(activeRx.investigations || []).length > 0 && (
          <div>
            <p className="text-xs text-gray-500">Investigations</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-gray-800">
              {activeRx.investigations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {(activeRx.advice || []).length > 0 && (
          <div>
            <p className="text-xs text-gray-500">Advice</p>
            <ul className="mt-1 list-disc pl-4 text-sm text-gray-800">
              {activeRx.advice.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {activeRx.follow_up && (
          <div>
            <p className="text-xs text-gray-500">Follow-up</p>
            <p className="text-sm text-gray-900">{activeRx.follow_up}</p>
          </div>
        )}
        {activeRx.pdf_url && (
          <Button
            as="a"
            href={activeRx.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            variant="bordered"
            startContent={<FileText className="h-4 w-4" />}
          >
            Open PDF
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      id={autoFocus ? 'prescribe-panel' : undefined}
      className="rounded-xl border border-gray-200 bg-white p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">E-Prescription</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {activeRx ? 'Draft' : 'New'}
        </span>
      </div>

      {demographicsStrip}

      <Textarea
        label="Symptoms"
        labelPlacement="outside"
        placeholder="Chief complaints / symptoms"
        value={symptoms}
        onValueChange={setSymptoms}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />
      <Textarea
        label="History"
        labelPlacement="outside"
        placeholder="Relevant medical / treatment history"
        value={medicalHistory}
        onValueChange={setMedicalHistory}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />
      <Textarea
        label="Diagnosis"
        labelPlacement="outside"
        placeholder="Primary diagnosis"
        isRequired
        value={diagnosis}
        onValueChange={setDiagnosis}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />
      <Textarea
        label="Clinical notes"
        labelPlacement="outside"
        placeholder="Additional notes (optional)"
        value={notes}
        onValueChange={setNotes}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Medicines</p>
        {items.map((item, index) => (
          <div
            key={`med-${index}`}
            className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-2"
          >
            <Input
              label="Medicine"
              size="sm"
              value={item.medicine_name}
              onValueChange={(v) => updateItem(index, 'medicine_name', v)}
              classNames={{ inputWrapper: 'bg-white' }}
            />
            <Input
              label="Dosage"
              size="sm"
              placeholder="e.g. 500mg"
              value={item.dosage}
              onValueChange={(v) => updateItem(index, 'dosage', v)}
              classNames={{ inputWrapper: 'bg-white' }}
            />
            <div className="sm:col-span-2 space-y-2">
              <Input
                label="Frequency / schedule"
                size="sm"
                placeholder="e.g. Morning - 1 Tab | Evening - 1 Tab"
                value={item.frequency}
                onValueChange={(v) => updateItem(index, 'frequency', v)}
                classNames={{ inputWrapper: 'bg-white' }}
              />
              <div className="flex flex-wrap gap-1">
                {FREQ_CHIPS.map((chip) => (
                  <Button
                    key={chip}
                    size="sm"
                    variant="flat"
                    className="h-7 min-w-0 px-2 text-xs"
                    onPress={() => appendFrequencyChip(index, chip)}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              label="Duration"
              size="sm"
              placeholder="e.g. 5 days"
              value={item.duration}
              onValueChange={(v) => updateItem(index, 'duration', v)}
              classNames={{ inputWrapper: 'bg-white' }}
            />
            <Select
              label="Meal timing"
              size="sm"
              selectedKeys={item.meal_timing ? [item.meal_timing] : ['none']}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(index, 'meal_timing', !val || val === 'none' ? '' : val)
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {MEAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.key || 'none'} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            <div className="sm:col-span-2 flex gap-2">
              <Input
                label="Instructions"
                size="sm"
                className="flex-1"
                value={item.instructions}
                onValueChange={(v) => updateItem(index, 'instructions', v)}
                classNames={{ inputWrapper: 'bg-white' }}
              />
              {items.length > 1 && (
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  className="self-end"
                  aria-label="Remove medicine"
                  onPress={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="flat"
          size="sm"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => setItems((prev) => [...prev, emptyItem()])}
        >
          Add medicine
        </Button>
      </div>

      <Textarea
        label="Investigations"
        labelPlacement="outside"
        placeholder="One investigation per line"
        value={investigations}
        onValueChange={setInvestigations}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />
      <Textarea
        label="Advice"
        labelPlacement="outside"
        placeholder="One advice line per line"
        value={advice}
        onValueChange={setAdvice}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />
      <Input
        label="Follow-up"
        labelPlacement="outside"
        placeholder="e.g. Review after 7 days"
        value={followUp}
        onValueChange={setFollowUp}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          color="primary"
          variant="flat"
          isLoading={isCreating || isUpdating}
          startContent={<Save className="h-4 w-4" />}
          onPress={handleSaveDraft}
        >
          Save draft
        </Button>
        {canSend && (
          <Button
            color="primary"
            isLoading={isCreating || isUpdating || isSending}
            startContent={<Send className="h-4 w-4" />}
            onPress={handleSend}
          >
            Send to patient
          </Button>
        )}
      </div>
    </div>
  )
}
