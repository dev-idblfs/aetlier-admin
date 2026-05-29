'use client';

import { CheckCircle2, Circle, FileCheck, ShieldCheck } from 'lucide-react';
import { VERIFICATION_STATUS } from '@/constants/verification';

/**
 * Admin checklist for completing doctor verification review.
 */
export default function VerificationReviewSteps({ verification, canVerify, canApprove }) {
  if (!verification) return null;

  const docs = verification.documents || [];
  const allDocsReviewed =
    docs.length > 0 && docs.every((d) => d.is_verified === true || d.status === 'verified');
  const hasRejectedDoc = docs.some((d) => d.is_verified === false && d.status === 'rejected');
  const isPending = verification.status === VERIFICATION_STATUS.PENDING;
  const isVerified = verification.status === VERIFICATION_STATUS.VERIFIED;

  const steps = [
    {
      id: 'upload',
      label: 'Doctor submitted credentials',
      done: docs.length > 0,
      detail: docs.length ? `${docs.length} document(s) on file` : 'Waiting for uploads',
    },
    {
      id: 'review-docs',
      label: 'Review each document',
      done: allDocsReviewed,
      detail: canVerify
        ? 'Open each file, then approve or reject with notes'
        : 'Requires verification.verify.any permission',
      optional: !canVerify,
    },
    {
      id: 'decision',
      label: 'Approve or reject verification',
      done: isVerified || verification.status === VERIFICATION_STATUS.REJECTED,
      detail: canApprove
        ? 'Final decision publishes profile when approved'
        : 'Requires verification.approve.any permission',
      optional: !canApprove,
    },
    {
      id: 'publish',
      label: 'Profile published on directory',
      done: isVerified,
      detail: 'Set automatically when verification is approved',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary-600" />
        <h2 className="text-base font-semibold text-gray-900">Review steps</h2>
      </div>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <div className="mt-0.5">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-700'}`}>
                {index + 1}. {step.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {isPending && hasRejectedDoc && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
          One or more documents were rejected. You can still reject the overall application or ask
          the doctor to re-upload via the patient app.
        </p>
      )}
      {isPending && docs.length > 0 && !allDocsReviewed && canVerify && (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <FileCheck className="w-3.5 h-3.5" />
          Complete document review before the final approve/reject step.
        </p>
      )}
    </div>
  );
}
