'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from '@/lib/icons';
import { Button, Spinner } from '@/lib/heroui';
import { useSelector } from 'react-redux';
import {
  useGetAdminVerificationRecordQuery,
} from '@/redux/services/api';
import { StatusBadge, EntityLink, Alert } from '@/components/ui';
import DocumentReviewCard from '@/components/verification/DocumentReviewCard';
import VerificationActions from '@/components/verification/VerificationActions';
import VerificationReviewSteps from '@/components/verification/VerificationReviewSteps';
import AuditTimeline from '@/components/audit/AuditTimeline';
import { VERIFICATION_STATUS } from '@/constants/verification';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

export default function VerificationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const verificationId = params.id;
  const user = useSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.VERIFICATION_VERIFY_ANY);
  const canVerify = canView;
  const canApprove = hasPermission(user, PERMISSIONS.VERIFICATION_APPROVE_ANY);

  const {
    data: record,
    isLoading,
    refetch,
  } = useGetAdminVerificationRecordQuery(verificationId, { skip: !canView || !verificationId });

  if (!canView) {
    return (
      <div className="p-6">
        <Alert
          variant="warning"
          title="Permission required"
          message="You do not have permission to review verifications."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Verification not found.</p>
        <Button className="mt-4" variant="flat" onPress={() => router.push('/verification')}>
          Back to queue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="light" onPress={() => router.push('/verification')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {record.doctor_name || 'Doctor verification'}
          </h1>
          <p className="text-sm text-gray-500">{record.doctor_email}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <VerificationReviewSteps
        verification={record}
        canVerify={canVerify}
        canApprove={canApprove}
      />

      {record.status === VERIFICATION_STATUS.REJECTED && record.rejection_reason && (
        <Alert
          variant="danger"
          title="Rejection reason"
          message={record.rejection_reason}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        {(record.documents?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          record.documents.map((doc) => (
            <DocumentReviewCard key={doc.id} doc={doc} onUpdated={refetch} />
          ))
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <VerificationActions verification={record} onUpdated={refetch} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <AuditTimeline
          entityType="doctor_verifications"
          entityId={record.id}
        />
      </div>

      {record.doctor_user_id && (
        <EntityLink
          href={`/doctors/${record.doctor_user_id}/edit`}
          label="Open doctor profile →"
          className="text-base"
        />
      )}
    </div>
  );
}
