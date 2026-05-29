/** Shared verification status and document type constants */

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const VERIFICATION_STATUS_LABELS = {
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const VERIFICATION_STATUS_COLORS = {
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
  expired: 'default',
};

export const DOCUMENT_TYPE_LABELS = {
  medical_license: 'Medical License',
  degree_certificate: 'Degree Certificate',
  specialization_certificate: 'Specialization Certificate',
  registration_certificate: 'Medical Council Registration',
  id_proof: 'Government ID Proof',
  other: 'Other',
};

export function isVerificationPending(status) {
  return status === VERIFICATION_STATUS.PENDING;
}

export function formatDocumentType(type) {
  return DOCUMENT_TYPE_LABELS[type] || type?.replace(/_/g, ' ') || 'Document';
}
