'use client';

import { Button, Tooltip } from '@heroui/react';
import { Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  buildConsultationJoinUrl,
  canJoinConsultation,
  DOCTOR_JOIN_TOOLTIP,
  getJoinWindowHint,
} from '@/utils/consultationJoinWindow';

export default function ConsultationJoinButton({
  appointment,
  size = 'sm',
  className,
  label = 'Join video call',
}) {
  if (!appointment || appointment.consultation_mode !== 'online') {
    return null;
  }

  const joinable = canJoinConsultation(appointment);
  const joinUrl = buildConsultationJoinUrl(appointment.id);

  const handleJoin = () => {
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async (e) => {
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success('Join link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <Tooltip
        content={
          joinable ? DOCTOR_JOIN_TOOLTIP : getJoinWindowHint()
        }
        placement="top"
      >
        <span>
          <Button
            size={size}
            color="warning"
            variant="solid"
            className="rounded-full bg-[#db924b] text-white font-semibold min-h-9"
            startContent={<Video className="h-4 w-4" />}
            isDisabled={!joinable}
            onPress={handleJoin}
            aria-label={label}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
      <Button
        size={size}
        variant="bordered"
        className="rounded-full border-[#d7c3b3] text-gray-700"
        onPress={handleCopy}
        aria-label="Copy join link"
      >
        Copy link
      </Button>
    </div>
  );
}
