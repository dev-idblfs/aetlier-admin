'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { Spinner } from '@/lib/heroui';
import { useSelector } from 'react-redux';
import { useGetAdminVerificationRecordQuery } from '@/redux/services/api';
import {
  FormPageLayout,
  FormCompactCard,
  FormSectionCard,
  RelatedLinks,
  StatusBadge,
  Alert,
} from '@/components/ui';
import DocumentReviewCard from '@/components/verification/DocumentReviewCard';
import VerificationActions from '@/components/verification/VerificationActions';
import VerificationReviewSteps from '@/components/verification/VerificationReviewSteps';
import AuditTimeline from '@/components/audit/AuditTimeline';
import { VERIFICATION_STATUS } from '@/constants/verification';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

export default function VerificationReviewPage() {
  const params = useParams();
  const verificationId = params.id;
  const user = useSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.VERIFICATION_VERIFY_ANY);
  const canVerify = canView;
  const canApprove = hasPermission(user, PERMISSIONS.VERIFICATION_APPROVE_ANY);

  const {
    data: record,
    isLoading,
    refetch,
  } = useGetAdminVerificationRecordQuery(verificationId, {
    skip: !canView || !verificationId,
  });

  if (!canView) {
    return (
      <FormPageLayout
        title="Verification"
        breadcrumbs={[
          { label: 'Verification', href: '/verification' },
          { label: 'Review' },
        ]}
        cancelHref="/verification"
        maxWidth="md"
      >
        <Alert
          variant="warning"
          title="Permission required"
          message="You do not have permission to review verifications."
        />
      </FormPageLayout>
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
      <FormPageLayout
        title="Verification"
        breadcrumbs={[
          { label: 'Verification', href: '/verification' },
          { label: 'Not found' },
        ]}
        cancelHref="/verification"
        maxWidth="md"
      >
        <FormCompactCard>
          <p className="text-sm text-gray-600">Verification not found.</p>
        </FormCompactCard>
      </FormPageLayout>
    );
  }

  const title = record.doctor_name || 'Doctor verification';

  return (
    <FormPageLayout
      title={title}
      breadcrumbs={[
        { label: 'Verification', href: '/verification' },
        { label: 'Review' },
      ]}
      cancelHref="/verification"
      maxWidth="md"
      actions={<StatusBadge status={record.status} />}
    >
      <div className="space-y-3">
        {record.doctor_email ? (
          <p className="text-sm text-gray-500 -mt-1">{record.doctor_email}</p>
        ) : null}

        <RelatedLinks
          title="Related"
          items={[
            ...(record.doctor_user_id
              ? [
                  {
                    label: record.doctor_name || 'Doctor profile',
                    href: `/doctors/${record.doctor_user_id}/edit`,
                    meta: 'Doctor',
                  },
                ]
              : []),
            { label: 'Verification queue', href: '/verification', meta: 'List' },
          ]}
        />

        <FormCompactCard>
          <FormSectionCard
            embedded
            title="Review steps"
            description="Primary verification workflow for this submission"
          >
            <VerificationReviewSteps
              verification={record}
              canVerify={canVerify}
              canApprove={canApprove}
            />
          </FormSectionCard>
        </FormCompactCard>

        {record.status === VERIFICATION_STATUS.REJECTED && record.rejection_reason ? (
          <Alert
            variant="danger"
            title="Rejection reason"
            message={record.rejection_reason}
          />
        ) : null}

        <FormCompactCard>
          <FormSectionCard embedded title="Documents">
            {(record.documents?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {record.documents.map((doc) => (
                  <DocumentReviewCard key={doc.id} doc={doc} onUpdated={refetch} />
                ))}
              </div>
            )}
          </FormSectionCard>
        </FormCompactCard>

        <FormCompactCard>
          <FormSectionCard embedded title="Actions">
            <VerificationActions verification={record} onUpdated={refetch} />
          </FormSectionCard>
        </FormCompactCard>

        <FormCompactCard>
          <FormSectionCard
            embedded
            title="Audit history"
            description="Secondary record of changes on this verification"
          >
            <AuditTimeline
              entityType="doctor_verifications"
              entityId={record.id}
              compact
            />
          </FormSectionCard>
        </FormCompactCard>
      </div>
    </FormPageLayout>
  );
}
