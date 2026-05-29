'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { useSelector } from 'react-redux';
import {
  useGetAdminVerificationRecordQuery,
} from '@/redux/services/api';
import VerificationStatusBadge from '@/components/verification/VerificationStatusBadge';
import DocumentReviewCard from '@/components/verification/DocumentReviewCard';
import VerificationActions from '@/components/verification/VerificationActions';
import VerificationReviewSteps from '@/components/verification/VerificationReviewSteps';
import AuditTimeline from '@/components/verification/AuditTimeline';
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
        <p className="text-gray-600">You do not have permission to review verifications.</p>
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
        <VerificationStatusBadge status={record.status} />
      </div>

      <VerificationReviewSteps
        verification={record}
        canVerify={canVerify}
        canApprove={canApprove}
      />

      {record.status === VERIFICATION_STATUS.REJECTED && record.rejection_reason && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm font-medium text-red-700">Rejection reason</p>
          <p className="text-sm text-red-600 mt-1">{record.rejection_reason}</p>
        </div>
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

      <AuditTimeline verificationId={record.id} />

      {record.doctor_user_id && (
        <Button
          variant="flat"
          onPress={() => router.push(`/doctors/${record.doctor_user_id}/edit`)}
        >
          Open doctor profile
        </Button>
      )}
    </div>
  );
}
