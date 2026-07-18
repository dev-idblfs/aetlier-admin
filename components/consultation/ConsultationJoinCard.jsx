'use client';

import { Button, Tooltip } from '@heroui/react';
import { Video, Copy, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import { cn } from '@/utils/cn';
import ConsultationStatusChip from './ConsultationStatusChip';
import {
  buildPatientConsultationJoinUrl,
  canJoinConsultation,
  DOCTOR_JOIN_TOOLTIP,
  PATIENT_LINK_TOOLTIP,
  ACCESS_LOCK_TOOLTIP,
  getAppointmentDateTime,
  getJoinWindowHint,
} from '@/utils/consultationJoinWindow';

export default function ConsultationJoinCard({
  appointment,
  consultation,
  variant = 'compact',
  className,
}) {
  const router = useRouter();

  if (!appointment || appointment.consultation_mode !== 'online') {
    return null;
  }

  const joinable = canJoinConsultation(appointment);
  const patientJoinUrl = buildPatientConsultationJoinUrl(appointment.id);
  const { date, time } = getAppointmentDateTime(appointment);
  const patientName =
    appointment.patient_info?.full_name ||
    appointment.user?.name ||
    'Patient';

  const handleJoin = () => {
    router.push(`/consultation/${appointment.id}`);
  };

  const handleCopyPatientLink = async () => {
    try {
      await navigator.clipboard.writeText(patientJoinUrl);
      toast.success('Patient join link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const isDetail = variant === 'detail';
  const patientWaiting =
    consultation?.active_session?.patient_joined_at &&
    !consultation?.active_session?.doctor_joined_at;

  return (
    <div
      className={cn(
        'rounded-xl border border-[#d7c3b3]/60 bg-gradient-to-br from-[#fffbf6] to-white p-4 shadow-sm',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#db924b]/15">
            <Video className="h-4 w-4 text-[#8b500b]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {isDetail ? (
              <h4 className="font-serif text-lg font-medium text-gray-900 flex items-center gap-2">
                {patientWaiting ? (
                  <>
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                      aria-hidden="true"
                    />
                    Your patient is waiting
                  </>
                ) : (
                  'Video consultation'
                )}
              </h4>
            ) : (
              <p className="font-serif text-base font-medium text-gray-900 truncate">
                {patientName}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(date)} · {formatTime(time)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="inline-flex items-center rounded-full bg-[#5a8486]/15 px-2.5 py-0.5 text-xs font-semibold text-[#00677e]">
            Online
          </span>
          <ConsultationStatusChip
            status={appointment.consultation_status || appointment.status}
            consultation={consultation}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <Tooltip
          content={joinable ? DOCTOR_JOIN_TOOLTIP : getJoinWindowHint()}
          placement="top"
        >
          <span className="flex-1">
            <Button
              fullWidth
              className="rounded-full bg-[#db924b] text-white font-semibold min-h-11"
              startContent={<Video className="h-4 w-4" />}
              isDisabled={!joinable}
              onPress={handleJoin}
              aria-label={
                isDetail ? 'Join secure consultation' : 'Join video call'
              }
            >
              {isDetail ? 'Join secure consultation' : 'Join video call'}
            </Button>
          </span>
        </Tooltip>
        <Tooltip content={PATIENT_LINK_TOOLTIP} placement="top">
          <Button
            variant="bordered"
            className="rounded-full border-[#d7c3b3] text-gray-700 min-h-11"
            startContent={<Copy className="h-4 w-4" />}
            onPress={handleCopyPatientLink}
            aria-label="Copy patient join link"
          >
            Copy patient link
          </Button>
        </Tooltip>
      </div>

      <p className="consultation-join-window text-xs text-gray-500 mb-2">
        {getJoinWindowHint()}
      </p>

      <Tooltip content={ACCESS_LOCK_TOOLTIP} placement="bottom">
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Patient &amp; doctor only — secure room</span>
        </p>
      </Tooltip>
    </div>
  );
}
