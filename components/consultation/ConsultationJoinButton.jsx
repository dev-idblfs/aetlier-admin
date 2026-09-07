'use client';

import { Button, Tooltip } from '@/lib/heroui';
import { Video } from '@/lib/icons';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  buildPatientConsultationJoinUrl,
  canJoinConsultation,
  DOCTOR_JOIN_TOOLTIP,
  PATIENT_LINK_TOOLTIP,
  getJoinWindowHint,
} from '@/utils/consultationJoinWindow';
import {
  openConsultationWindow,
  subscribeConsultationEvents,
} from '@/utils/openConsultationWindow';

export default function ConsultationJoinButton({
  appointment,
  size = 'sm',
  className,
  label = 'Join video call',
  onConsultationEnded,
}) {
  const router = useRouter();

  useEffect(() => {
    if (!appointment?.id) return undefined;
    return subscribeConsultationEvents((msg) => {
      if (
        msg?.type === 'consultation-ended' &&
        String(msg.appointmentId) === String(appointment.id)
      ) {
        onConsultationEnded?.(appointment.id);
      }
    });
  }, [appointment?.id, onConsultationEnded]);

  if (!appointment || appointment.consultation_mode !== 'online') {
    return null;
  }

  const joinable = canJoinConsultation(appointment);
  const patientJoinUrl = buildPatientConsultationJoinUrl(appointment.id);

  const handleJoin = () => {
    const result = openConsultationWindow(appointment.id);
    if (result.mode === 'same-tab') {
      router.push(`/consultation/${appointment.id}`);
    }
  };

  const handleCopyPatientLink = async (e) => {
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(patientJoinUrl);
      toast.success('Patient join link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <Tooltip
        content={joinable ? DOCTOR_JOIN_TOOLTIP : getJoinWindowHint()}
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
      <Tooltip content={PATIENT_LINK_TOOLTIP} placement="top">
        <Button
          size={size}
          variant="bordered"
          className="rounded-full border-[#d7c3b3] text-gray-700"
          onPress={handleCopyPatientLink}
          aria-label="Copy patient join link"
        >
          Copy patient link
        </Button>
      </Tooltip>
    </div>
  );
}
