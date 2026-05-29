'use client';

import { useState } from 'react';
import { Button, Textarea } from '@heroui/react';
import { FileText, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useVerifyDocumentMutation,
  useLazyGetDocumentDownloadUrlQuery,
} from '@/redux/services/api';
import { formatDocumentType } from '@/constants/verification';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { useSelector } from 'react-redux';

export default function DocumentReviewCard({ doc, onUpdated }) {
  const user = useSelector((s) => s.auth.user);
  const canVerify = hasPermission(user, PERMISSIONS.VERIFICATION_VERIFY_ANY);
  const [notes, setNotes] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [verifyDocument, { isLoading }] = useVerifyDocumentMutation();
  const [fetchDownloadUrl] = useLazyGetDocumentDownloadUrlQuery();

  const handlePreview = async () => {
    try {
      const result = await fetchDownloadUrl(doc.id).unwrap();
      if (result?.download_url) {
        window.open(result.download_url, '_blank', 'noopener,noreferrer');
      } else if (doc.document_url || doc.file_url) {
        window.open(doc.document_url || doc.file_url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      if (doc.document_url || doc.file_url) {
        window.open(doc.document_url || doc.file_url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not load document preview');
      }
    }
  };

  const handleVerify = async (isVerified) => {
    if (!isVerified && !notes.trim()) {
      toast.error('Please add a note when rejecting a document');
      return;
    }
    try {
      await verifyDocument({
        documentId: doc.id,
        is_verified: isVerified,
        verification_notes: notes.trim() || undefined,
      }).unwrap();
      toast.success(isVerified ? 'Document approved' : 'Document rejected');
      setShowReject(false);
      setNotes('');
      onUpdated?.();
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to update document');
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700 truncate">
              {formatDocumentType(doc.document_type)}
            </p>
            <p className="text-xs text-gray-400">
              {doc.is_verified ? 'Approved' : doc.status === 'rejected' ? 'Rejected' : 'Pending'}
            </p>
          </div>
        </div>
        <Button size="sm" variant="flat" onPress={handlePreview}>
          Preview <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {canVerify && !doc.is_verified && doc.status !== 'rejected' && (
        <div className="space-y-2">
          {showReject && (
            <Textarea
              size="sm"
              placeholder="Rejection notes (required)"
              value={notes}
              onValueChange={setNotes}
              minRows={2}
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              color="success"
              isLoading={isLoading}
              startContent={<CheckCircle className="w-3 h-3" />}
              onPress={() => handleVerify(true)}
            >
              Approve doc
            </Button>
            {!showReject ? (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={<XCircle className="w-3 h-3" />}
                onPress={() => setShowReject(true)}
              >
                Reject doc
              </Button>
            ) : (
              <Button
                size="sm"
                color="danger"
                isLoading={isLoading}
                onPress={() => handleVerify(false)}
              >
                Confirm reject
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
