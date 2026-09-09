'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Input, Textarea, Spinner, Select, SelectItem } from '@/lib/heroui'
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
  { key: 'after_food', label: 'After food' },
  { key: 'before_food', label: 'Before food' },
  { key: 'with_food', label: 'With food' },
  { key: 'any', label: 'Any time' },
]

const FREQ_CHIPS = [
  'Morning - 1 Tab',
  'Afternoon - 1 Tab',
  'Evening - 1 Tab',
  'Night - 1 Tab',
]

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '30 days',
  'As advised',
]

const REFILL_OPTIONS = [
  { key: '0', label: '0 — none' },
  { key: '1', label: '1 refill' },
  { key: '2', label: '2 refills' },
  { key: '3', label: '3 refills' },
]

const ALLERGY_OPTIONS = [
  { key: 'NKDA', label: 'NKDA (no known drug allergies)' },
  { key: 'Penicillin', label: 'Penicillin' },
  { key: 'Sulfa', label: 'Sulfa' },
  { key: 'Aspirin / NSAIDs', label: 'Aspirin / NSAIDs' },
  { key: 'Other', label: 'Other (specify)' },
]

const FOLLOW_UP_OPTIONS = [
  'Review in 3 days',
  'Review in 7 days',
  'Review in 14 days',
  'Review in 1 month',
  'As needed (PRN)',
]

const STORAGE_OPTIONS = [
  'Store in a cool, dry place',
  'Protect from light',
  'Refrigerate (2–8°C)',
  'No special storage',
]

const FORM_PRESETS = [
  {
    key: 'oral_tablet',
    label: 'Oral tablet',
    tags: 'ORAL, TABLET',
    description: 'Oral tablet',
  },
  {
    key: 'oral_capsule',
    label: 'Oral capsule',
    tags: 'ORAL, CAPSULE',
    description: 'Oral capsule',
  },
  {
    key: 'topical_cream',
    label: 'Topical cream',
    tags: 'TOPICAL, CREAM',
    description: 'Topical cream',
  },
  {
    key: 'topical_gel',
    label: 'Topical gel / serum',
    tags: 'TOPICAL, GEL',
    description: 'Topical gel / serum',
  },
  {
    key: 'injectable',
    label: 'Injectable',
    tags: 'INJECTABLE',
    description: 'Injectable',
  },
]

const QUANTITY_OPTIONS = [
  'As directed',
  '10 tablets',
  '15 tablets',
  '20 tablets',
  '30 tablets',
  '1 tube',
  '1 bottle',
]

const DEFAULT_STORAGE = STORAGE_OPTIONS[0]
const DEFAULT_DURATION = '5 days'
const DEFAULT_QUANTITY = QUANTITY_OPTIONS[0]
const DEFAULT_FORM = FORM_PRESETS[0]

const emptyItem = () => ({
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration: DEFAULT_DURATION,
  instructions: '',
  meal_timing: 'after_food',
  quantity: DEFAULT_QUANTITY,
  refills: '0',
  storage: DEFAULT_STORAGE,
  description: DEFAULT_FORM.description,
  form_tags: DEFAULT_FORM.tags,
  form_preset: DEFAULT_FORM.key,
})

function inferFormPreset(formTags, description) {
  const normalized = String(formTags || '')
    .toUpperCase()
    .replace(/\s+/g, '')
  const match = FORM_PRESETS.find((preset) => {
    const presetNorm = preset.tags.replace(/\s+/g, '')
    return normalized === presetNorm || description === preset.description
  })
  return match?.key || DEFAULT_FORM.key
}

function mapItemFromApi(item) {
  const formTags = Array.isArray(item.form_tags)
    ? item.form_tags.join(', ')
    : item.form_tags || DEFAULT_FORM.tags
  const description = item.description || DEFAULT_FORM.description
  return {
    medicine_name: item.medicine_name || '',
    dosage: item.dosage || '',
    frequency: item.frequency || '',
    duration: item.duration || DEFAULT_DURATION,
    instructions: item.instructions || '',
    meal_timing: item.meal_timing || 'after_food',
    quantity: item.quantity || DEFAULT_QUANTITY,
    refills:
      item.refills === 0 || item.refills ? String(item.refills) : '0',
    storage: item.storage || DEFAULT_STORAGE,
    description,
    form_tags: formTags,
    form_preset: inferFormPreset(formTags, description),
  }
}

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
  const [allergies, setAllergies] = useState('NKDA')
  const [allergyOther, setAllergyOther] = useState('')
  const [dispenseAsWritten, setDispenseAsWritten] = useState(true)
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
      setAllergies('NKDA')
      setAllergyOther('')
      setDispenseAsWritten(true)
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
    const savedAllergy = (activeRx.allergies || 'NKDA').trim() || 'NKDA'
    const knownAllergy = ALLERGY_OPTIONS.find(
      (opt) => opt.key !== 'Other' && opt.key === savedAllergy
    )
    if (knownAllergy) {
      setAllergies(knownAllergy.key)
      setAllergyOther('')
    } else if (savedAllergy === 'NKDA') {
      setAllergies('NKDA')
      setAllergyOther('')
    } else {
      setAllergies('Other')
      setAllergyOther(savedAllergy)
    }
    setDispenseAsWritten(
      activeRx.dispense_as_written === undefined || activeRx.dispense_as_written === null
        ? true
        : Boolean(activeRx.dispense_as_written)
    )
    setItems(
      activeRx.items?.length
        ? activeRx.items.map(mapItemFromApi)
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
    const allergyValue =
      allergies === 'Other'
        ? allergyOther.trim() || 'Other'
        : allergies || 'NKDA'
    const cleaned = items
      .map((item) => {
        const tags = String(item.form_tags || DEFAULT_FORM.tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        const refillsRaw = String(item.refills ?? '0').trim()
        const refills = Number.parseInt(refillsRaw === '' ? '0' : refillsRaw, 10)
        return {
          medicine_name: item.medicine_name.trim(),
          dosage: item.dosage.trim() || null,
          frequency: item.frequency.trim() || null,
          duration: (item.duration || DEFAULT_DURATION).trim() || null,
          instructions: item.instructions.trim() || null,
          meal_timing: item.meal_timing || 'after_food',
          quantity: (item.quantity || DEFAULT_QUANTITY).trim() || null,
          refills: Number.isFinite(refills) ? refills : 0,
          storage: (item.storage || DEFAULT_STORAGE).trim() || null,
          description: (item.description || DEFAULT_FORM.description).trim() || null,
          form_tags: tags.length ? tags : DEFAULT_FORM.tags.split(', '),
        }
      })
      .filter((item) => item.medicine_name)
    return {
      diagnosis: diagnosis.trim(),
      symptoms: symptoms.trim() || null,
      medical_history: medicalHistory.trim() || null,
      investigations: textToLines(investigations),
      advice: textToLines(advice),
      follow_up: followUp.trim() || null,
      notes: notes.trim() || null,
      allergies: allergyValue,
      dispense_as_written: Boolean(dispenseAsWritten),
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
      const sent = await sendPrescription({ prescriptionId: rxId, appointmentId }).unwrap()
      if (sent?.delivery?.email?.sent) {
        toast.success('Prescription emailed to the patient')
      } else if (sent?.delivery?.email?.error) {
        toast.success('Prescription issued in the patient app')
        toast.error(`Email was not delivered: ${sent.delivery.email.error}`)
      } else {
        toast.success('Prescription issued to the patient')
      }
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to send prescription')
    }
  }

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const applyFormPreset = (index, presetKey) => {
    const preset =
      FORM_PRESETS.find((p) => p.key === presetKey) || DEFAULT_FORM
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              form_preset: preset.key,
              form_tags: preset.tags,
              description: preset.description,
            }
          : item
      )
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

  const allergySelectKey =
    allergies === 'Other' || ALLERGY_OPTIONS.some((o) => o.key === allergies)
      ? allergies
      : 'Other'

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
        label="Diagnosis"
        labelPlacement="outside"
        placeholder="Primary diagnosis"
        isRequired
        value={diagnosis}
        onValueChange={setDiagnosis}
        minRows={2}
        classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Known allergies"
          labelPlacement="outside"
          selectedKeys={[allergySelectKey]}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] || 'NKDA'
            setAllergies(val)
            if (val !== 'Other') setAllergyOther('')
          }}
          classNames={{ trigger: 'bg-white border border-gray-200' }}
        >
          {ALLERGY_OPTIONS.map((opt) => (
            <SelectItem key={opt.key} textValue={opt.label}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          label="Follow-up"
          labelPlacement="outside"
          selectedKeys={
            FOLLOW_UP_OPTIONS.includes(followUp) ? [followUp] : []
          }
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0]
            setFollowUp(val ? String(val) : '')
          }}
          classNames={{ trigger: 'bg-white border border-gray-200' }}
        >
          {FOLLOW_UP_OPTIONS.map((opt) => (
            <SelectItem key={opt} textValue={opt}>
              {opt}
            </SelectItem>
          ))}
        </Select>
      </div>
      {allergies === 'Other' && (
        <Input
          label="Specify allergy"
          labelPlacement="outside"
          placeholder="e.g. Lidocaine"
          value={allergyOther}
          onValueChange={setAllergyOther}
          classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
        />
      )}

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
              label="Dosage / strength"
              size="sm"
              placeholder="e.g. 500mg"
              value={item.dosage}
              onValueChange={(v) => updateItem(index, 'dosage', v)}
              classNames={{ inputWrapper: 'bg-white' }}
            />
            <Select
              label="Form"
              size="sm"
              selectedKeys={[item.form_preset || DEFAULT_FORM.key]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                if (val) applyFormPreset(index, String(val))
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {FORM_PRESETS.map((opt) => (
                <SelectItem key={opt.key} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Duration"
              size="sm"
              selectedKeys={[item.duration || DEFAULT_DURATION]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(index, 'duration', val ? String(val) : DEFAULT_DURATION)
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt} textValue={opt}>
                  {opt}
                </SelectItem>
              ))}
            </Select>
            <div className="sm:col-span-2 space-y-2">
              <Input
                label="Frequency / schedule"
                size="sm"
                placeholder="Tap chips below or type"
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
            <Select
              label="Meal timing"
              size="sm"
              selectedKeys={[item.meal_timing || 'after_food']}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(index, 'meal_timing', val ? String(val) : 'after_food')
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {MEAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Refills"
              size="sm"
              selectedKeys={[item.refills || '0']}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(index, 'refills', val != null ? String(val) : '0')
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {REFILL_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} textValue={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Quantity"
              size="sm"
              selectedKeys={[
                QUANTITY_OPTIONS.includes(item.quantity)
                  ? item.quantity
                  : DEFAULT_QUANTITY,
              ]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(
                  index,
                  'quantity',
                  val ? String(val) : DEFAULT_QUANTITY
                )
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {QUANTITY_OPTIONS.map((opt) => (
                <SelectItem key={opt} textValue={opt}>
                  {opt}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Storage"
              size="sm"
              selectedKeys={[
                STORAGE_OPTIONS.includes(item.storage)
                  ? item.storage
                  : DEFAULT_STORAGE,
              ]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0]
                updateItem(
                  index,
                  'storage',
                  val ? String(val) : DEFAULT_STORAGE
                )
              }}
              classNames={{ trigger: 'bg-white' }}
            >
              {STORAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} textValue={opt}>
                  {opt}
                </SelectItem>
              ))}
            </Select>
            <div className="sm:col-span-2 flex gap-2">
              <Input
                label="Instructions (SIG)"
                size="sm"
                className="flex-1"
                placeholder="Optional — defaults from frequency"
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
