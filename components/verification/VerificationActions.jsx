'use client';

import { useState } from 'react';
import { Button, Textarea } from '@heroui/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUpdateVerificationStatusMutation } from '@/redux/services/api';
import { VERIFICATION_STATUS, isVerificationPending } from '@/constants/verification';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { useSelector } from 'react-redux';

export default function VerificationActions({ verification, onUpdated }) {
  const user = useSelector((s) => s.auth.user);
  const canApprove = hasPermission(user, PERMISSIONS.VERIFICATION_APPROVE_ANY);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updateStatus, { isLoading }] = useUpdateVerificationStatusMutation();

  if (!verification || !canApprove || !isVerificationPending(verification.status)) {
    return null;
  }

  const handleApprove = async () => {
    try {
      await updateStatus({
        verificationId: verification.id,
        status: VERIFICATION_STATUS.VERIFIED,
      }).unwrap();
      toast.success('Verification approved');
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to approve verification');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    try {
      await updateStatus({
        verificationId: verification.id,
        status: VERIFICATION_STATUS.REJECTED,
        rejection_reason: rejectionReason.trim(),
      }).unwrap();
      toast.success('Verification rejected');
      setRejecting(false);
      setRejectionReason('');
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to reject verification');
    }
  };

  if (rejecting) {
    return (
      <div className="space-y-2">
        <Textarea
          label="Rejection reason"
          placeholder="Explain why this verification is being rejected…"
          value={rejectionReason}
          onValueChange={setRejectionReason}
          minRows={2}
          labelPlacement="outside"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="flat" onPress={() => { setRejecting(false); setRejectionReason(''); }}>
            Cancel
          </Button>
          <Button
            size="sm"
            color="danger"
            isLoading={isLoading}
            startContent={!isLoading && <XCircle className="w-4 h-4" />}
            onPress={handleReject}
          >
            Confirm reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        color="success"
        size="sm"
        isLoading={isLoading}
        startContent={!isLoading && <CheckCircle className="w-4 h-4" />}
        onPress={handleApprove}
      >
        Approve verification
      </Button>
      <Button
        color="danger"
        variant="flat"
        size="sm"
        startContent={<XCircle className="w-4 h-4" />}
        onPress={() => setRejecting(true)}
      >
        Reject
      </Button>
    </div>
  );
}
