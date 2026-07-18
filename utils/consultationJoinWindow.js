import config from '@/config';

export const JOIN_WINDOW_BEFORE_MIN = 15;
export const JOIN_WINDOW_AFTER_MIN = 60;

const JOINABLE_STATUSES = new Set([
  'confirmed',
  'ready',
  'scheduled',
  'in_progress',
]);

export function getAppointmentDateTime(appointment) {
  if (!appointment) return { date: null, time: null };
  return {
    date: appointment.appointment_date || appointment.preferred_date,
    time: appointment.appointment_time || appointment.preferred_time,
  };
}

export function canJoinConsultation(appointment) {
  if (!appointment || appointment.consultation_mode !== 'online') return false;

  const status = String(
    appointment.consultation_status || appointment.status || ''
  ).toLowerCase();
  if (!JOINABLE_STATUSES.has(status)) return false;

  const { date, time } = getAppointmentDateTime(appointment);
  if (!date || !time) return false;

  const [h, m] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(h, m || 0, 0, 0);
  const windowStart = new Date(
    start.getTime() - JOIN_WINDOW_BEFORE_MIN * 60 * 1000
  );
  const windowEnd = new Date(
    start.getTime() + JOIN_WINDOW_AFTER_MIN * 60 * 1000
  );
  const now = new Date();
  return now >= windowStart && now <= windowEnd;
}

export function getJoinWindowHint() {
  return `Join window: ${JOIN_WINDOW_BEFORE_MIN} min before – ${JOIN_WINDOW_AFTER_MIN} min after`;
}

/** Doctor/staff join — stays on admin (same session). */
export function buildDoctorConsultationJoinUrl(appointmentId) {
  const base = (config.adminUrl || 'http://localhost:3001').replace(/\/$/, '');
  return `${base}/consultation/${appointmentId}`;
}

/** Patient-facing share link — public web app. */
export function buildPatientConsultationJoinUrl(appointmentId) {
  const base = (config.frontendUrl || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/consultation/${appointmentId}`;
}

/** @deprecated Use buildDoctorConsultationJoinUrl */
export function buildConsultationJoinUrl(appointmentId) {
  return buildDoctorConsultationJoinUrl(appointmentId);
}

export const DOCTOR_JOIN_TOOLTIP =
  'Opens the self-hosted LiveKit room on the clinic web app (sign in as the doctor if needed).';

export const PATIENT_LINK_TOOLTIP =
  'Copies the patient join link for the public web app (share via email/WhatsApp).';

export const ACCESS_LOCK_TOOLTIP =
  'Only the booked patient and assigned doctor (or clinic staff) can join this consultation.';
export function isOnlineConsultation(appointment) {
  return appointment?.consultation_mode === 'online';
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return String(dateStr).slice(0, 10) === today;
}
