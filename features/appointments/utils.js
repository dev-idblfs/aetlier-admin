export const getDoctorName = (appointment) =>
  appointment?.doctor?.name || appointment?.doctor_name || null

export const getPatientName = (appointment) =>
  appointment?.patient_info?.full_name ||
  appointment?.user?.name ||
  appointment?.user_name ||
  null

export const getPatientEmail = (appointment) =>
  appointment?.patient_info?.email || appointment?.user?.email || null

export const getPatientPhone = (appointment) =>
  appointment?.patient_info?.phone || null

export const getServiceName = (appointment) =>
  appointment?.service_name || appointment?.service?.name || null

export const getModeLabel = (mode) =>
  String(mode || 'in_person').toLowerCase() === 'online' ? 'Online' : 'In-clinic'

export const getClinicName = (appointment) =>
  appointment?.clinic?.name || null

export const shortAppointmentId = (id) => {
  if (!id) return '—'
  const s = String(id)
  return s.length > 8 ? `${s.slice(0, 8)}…` : s
}

export const getFeeLabel = (appointment) => {
  const fee = appointment?.fee_display
  if (fee === null || fee === undefined || fee === '') return null
  const num = Number(fee)
  if (Number.isNaN(num)) return null
  return `₹${num.toLocaleString('en-IN')}`
}

export const getPaymentSummary = (appointment) => {
  const fee = getFeeLabel(appointment)
  if (appointment?.invoice_number) {
    return `${appointment.invoice_number}${fee ? ` · ${fee}` : ''}`
  }
  if (fee) return `${fee} · Pay at clinic`
  return 'Pay at clinic'
}

export const escapeCsvValue = (value) => {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export const copyText = async (text) => {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(String(text))
    return true
  } catch {
    return false
  }
}
