import { VERIFICATION_STATUS } from '@/constants/verification';

/**
 * Map doctor + verification fields to StatusBadge status key.
 */
export function getDoctorDisplayStatus(doctor) {
  const vStatus = doctor?.verification_status;
  if (vStatus === VERIFICATION_STATUS.PENDING) return 'pending';
  if (vStatus === VERIFICATION_STATUS.REJECTED) return 'inactive';
  if (vStatus === VERIFICATION_STATUS.VERIFIED) {
    return doctor?.is_published ? 'active' : 'pending';
  }
  if (doctor?.is_active === false) return 'inactive';
  if (doctor?.is_published) return 'active';
  if (doctor?.is_active !== false) return 'pending';
  return 'inactive';
}
