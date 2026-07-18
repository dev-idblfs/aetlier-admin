'use client';

/**
 * Doctor consultation lobby (admin).
 * Video WebRTC runs on the public web app via self-hosted LiveKit —
 * admin does not embed livekit-client (keeps admin build free of that SDK).
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import { ExternalLink, Video } from 'lucide-react';
import {
  useGetAppointmentQuery,
  useGetConsultationQuery,
  useSetMediaModeMutation,
} from '@/redux/services/api';
import {
  buildPatientConsultationJoinUrl,
  canJoinConsultation,
  getAppointmentDateTime,
  getJoinWindowHint,
} from '@/utils/consultationJoinWindow';
import { formatDate, formatTime } from '@/utils/dateFormatters';

export default function DoctorConsultationShell({ appointmentId }) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useGetAppointmentQuery(appointmentId, { skip: !appointmentId });

  const { data: consultation } = useGetConsultationQuery(appointmentId, {
    skip: !appointmentId,
  });

  const [setMediaModeApi] = useSetMediaModeMutation();

  const patientName = useMemo(() => {
    return (
      appointment?.patient_info?.full_name ||
      appointment?.user?.name ||
      appointment?.patient_name ||
      consultation?.patient_name ||
      'Patient'
    );
  }, [appointment, consultation]);

  const joinAvailable = useMemo(
    () => canJoinConsultation(appointment),
    [appointment]
  );

  const { date, time } = getAppointmentDateTime(appointment);
  const roomUrl = buildPatientConsultationJoinUrl(appointmentId);

  const handleOpenRoom = async () => {
    setIsOpening(true);
    try {
      await setMediaModeApi({
        appointmentId,
        media_mode: 'video',
      }).unwrap();
    } catch (e) {
      console.warn('Media mode update failed, opening room anyway:', e);
    } finally {
      setIsOpening(false);
      window.open(roomUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (isError) {
    const status = error?.status;
    const isDenied = status === 403;
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">
          {isDenied
            ? 'Access denied'
            : status === 404
              ? 'Appointment not found'
              : 'Unable to load appointment'}
        </p>
        <p className="mb-6 max-w-sm text-sm text-white/60">
          {isDenied
            ? 'Only the assigned doctor or clinic staff can open this consultation.'
            : 'Check the link or return to appointments.'}
        </p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">Appointment not found</p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  if (appointment.consultation_mode !== 'online') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">This is an in-clinic appointment</p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <h1 className="mb-2 font-serif text-2xl font-medium">Video consultation</h1>
      <p className="mb-1 text-white/80">{patientName}</p>
      <p className="mb-6 text-sm text-white/50">
        {formatDate(date)} · {formatTime(time)}
      </p>
      <p className="mb-8 max-w-md text-sm text-white/55">
        Video runs on the clinic web app with self-hosted LiveKit. Open the room
        there (sign in as the doctor if prompted).
      </p>
      <Button
        className="min-h-12 w-full max-w-xs rounded-full bg-[#db924b] font-semibold text-white"
        isDisabled={!joinAvailable || isOpening}
        isLoading={isOpening}
        onPress={handleOpenRoom}
        startContent={<ExternalLink className="h-4 w-4" />}
      >
        Open video room
      </Button>
      <p className="mt-4 text-xs text-white/40">{getJoinWindowHint()}</p>
      {!joinAvailable && (
        <p className="mt-2 text-xs text-amber-400/80">Outside join window</p>
      )}
      <button
        type="button"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/40 underline hover:text-white/70"
        onClick={() => router.push('/appointments')}
      >
        <Video className="h-3.5 w-3.5" aria-hidden="true" />
        Back to appointments
      </button>
    </div>
  );
}
