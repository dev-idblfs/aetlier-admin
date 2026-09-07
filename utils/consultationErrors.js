/**
 * Map consultation API / media errors for admin doctor UI.
 */

const ERROR_LABELS = {
  livekit_not_configured:
    'Video service is not configured. Contact platform ops.',
  livekit_sdk_missing: 'Video service is unavailable.',
  token_generation_failed: 'Could not start the session. Try again.',
  consultation_access_denied:
    'Only the assigned doctor can join this consultation.',
  join_window_closed:
    'The join window has closed (open until 3 hours after the scheduled start).',
  join_window_not_open:
    'Join opens 15 minutes before the scheduled start.',
  appointment_not_joinable: 'This appointment cannot be joined.',
  consultation_completed: 'This consultation has already ended.',
  consultation_cancelled: 'This consultation was cancelled.',
  NotAllowedError:
    'Camera or microphone permission denied. Allow access and try again.',
  NotFoundError: 'No camera or microphone found.',
  NotReadableError: 'Camera or microphone is in use by another app.',
  'could not establish pc connection':
    'Video media path failed. Network may be blocking WebRTC — try another network, or ask ops to open TCP 7881 + UDP media ports on the LiveKit host.',
};

export function formatDoctorConsultationError(err) {
  const detail = err?.data?.detail ?? err?.message ?? err?.name;
  if (!detail) return 'Unable to connect. Check your connection and try again.';
  if (typeof detail === 'string') {
    const mapped = ERROR_LABELS[detail];
    if (mapped) return mapped;
    const lower = detail.toLowerCase();
    if (lower.includes('pc connection') || lower.includes('peerconnection')) {
      return ERROR_LABELS['could not establish pc connection'];
    }
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || String(d)).join(', ');
  }
  return String(detail);
}

export async function preflightMediaPermissions(mediaMode = 'video') {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }
  const constraints =
    mediaMode === 'audio'
      ? { audio: true, video: false }
      : { audio: true, video: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
