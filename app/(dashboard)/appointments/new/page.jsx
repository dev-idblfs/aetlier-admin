'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Save, Search, User } from '@/lib/icons';
import { Button, Input, SelectItem, Spinner, Chip } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
  FormDivider,
} from '@/components/ui/FormFields';
import { IndiaStateCityFields } from '@/components/ui/IndiaStateCityFields';
import {
  FormPageLayout,
  FormSectionCard,
  FormActions,
  FormCompactCard,
} from '@/components/ui';
import {
  useCreateAppointmentMutation,
  useGetDoctorsQuery,
  useGetDoctorServicesQuery,
  useGetAppointmentDateAvailabilityQuery,
  useLazySearchCustomersQuery,
} from '@/redux/services/api';
import {
  hasAnyPermission,
  PERMISSIONS,
} from '@/utils/permissions';
import { withUserPermissions } from '@/utils/navAccess';
import AccessDenied from '@/components/AccessDenied';
import { cn } from '@/utils/cn';

const CLINIC_LABEL = 'Aetlier Wellness Clinic';

const emptyDefaults = {
  patient_name: '',
  patient_email: '',
  patient_phone: '',
  patient_gender: '',
  patient_date_of_birth: '',
  patient_city: '',
  patient_state_id: '',
  patient_city_id: '',
  patient_address: '',
  patient_user_id: '',
  service_id: '',
  doctor_id: '',
  consultation_mode: 'in_person',
  media_mode: 'video',
  preferred_date: '',
  preferred_time: '',
  special_notes: '',
};

const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || first;
  return { first, last };
};

const formatDob = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return String(value).slice(0, 10);
};

const toTimeInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  return String(value).slice(0, 5);
};

const buildCreatePayload = (data) => {
  const { first, last } = splitName(data.patient_name);
  const base = {
    service_id: data.service_id,
    doctor_id: data.doctor_id,
    preferred_date: data.preferred_date,
    preferred_time:
      data.preferred_time?.length === 5
        ? `${data.preferred_time}:00`
        : data.preferred_time,
    special_notes: data.special_notes || '',
    consultation_mode: data.consultation_mode || 'in_person',
    patient_first_name: first,
    patient_last_name: last,
    patient_email: data.patient_email,
    patient_phone: data.patient_phone || undefined,
    patient_gender: data.patient_gender || undefined,
    patient_date_of_birth: data.patient_date_of_birth || undefined,
    patient_city: data.patient_city || undefined,
    patient_state_id: data.patient_state_id || undefined,
    patient_city_id: data.patient_city_id || undefined,
    patient_address: data.patient_address || undefined,
  };
  if (data.consultation_mode === 'online' && data.media_mode) {
    base.media_mode = data.media_mode;
  }
  if (data.patient_user_id) {
    return { ...base, patient_user_id: data.patient_user_id };
  }
  return { ...base, book_for_other: true };
};

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user, permissions } = useSelector((state) => state.auth);
  const authUser = withUserPermissions(user, permissions);
  const canCreate = hasAnyPermission(authUser, [
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE_ANY,
  ]);
  const canReadDoctors = hasAnyPermission(authUser, [PERMISSIONS.DOCTOR_READ_ANY]);

  const [searchQ, setSearchQ] = useState('');
  const [linkedPatient, setLinkedPatient] = useState(null);
  const [triggerSearch, { data: searchData, isFetching: searching, isError: searchError }] =
    useLazySearchCustomersQuery();

  const { data: doctorsData } = useGetDoctorsQuery(undefined, { skip: !canReadDoctors });
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation();
  const doctors = doctorsData?.doctors || doctorsData || [];

  const methods = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: emptyDefaults,
    mode: 'onTouched',
  });

  const {
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const doctorId = watch('doctor_id');
  const mode = watch('consultation_mode') || 'in_person';
  const serviceId = watch('service_id');
  const preferredDate = watch('preferred_date');
  const preferredTime = watch('preferred_time');

  const { data: doctorServices, isFetching: loadingServices } = useGetDoctorServicesQuery(
    { doctorId, mode },
    { skip: !doctorId || !mode },
  );
  const { data: slots, isFetching: loadingSlots } = useGetAppointmentDateAvailabilityQuery(
    { serviceId, date: preferredDate, doctorId },
    { skip: !serviceId || !preferredDate || !doctorId },
  );

  const serviceList = useMemo(
    () => (Array.isArray(doctorServices) ? doctorServices : []),
    [doctorServices],
  );
  const searchResults = Array.isArray(searchData) ? searchData : [];
  const availableSlots = useMemo(() => {
    const list = Array.isArray(slots) ? slots : [];
    return list.filter((s) => s.is_available !== false);
  }, [slots]);

  const selectedService = serviceList.find((s) => String(s.service_id) === String(serviceId));
  const selectedDoctor = doctors.find((d) => String(d.user_id || d.id) === String(doctorId));
  const feePreview = useMemo(() => {
    if (mode === 'online') {
      const fee = selectedDoctor?.consultation_fee;
      if (fee != null && fee !== '') return Number(fee);
    }
    const price = selectedService?.selling_price ?? selectedService?.price;
    return price != null ? Number(price) : null;
  }, [mode, selectedDoctor, selectedService]);

  useEffect(() => {
    if (!serviceId || !serviceList.length) return;
    const stillValid = serviceList.some((s) => String(s.service_id) === String(serviceId));
    if (!stillValid) {
      setValue('service_id', '');
      setValue('preferred_time', '');
    }
  }, [serviceList, serviceId, setValue]);

  const handleSearch = () => {
    const term = searchQ.trim();
    if (term.length < 2) {
      toast.error('Enter at least 2 characters');
      return;
    }
    triggerSearch({ q: term, limit: 10 });
  };

  const handleSelectPatient = (row) => {
    const name =
      row.display_name ||
      [row.first_name, row.last_name].filter(Boolean).join(' ') ||
      '';
    setLinkedPatient(row);
    setValue('patient_user_id', row.id);
    setValue('patient_name', name);
    setValue('patient_email', row.email || '');
    setValue('patient_phone', row.phone || '');
    setValue('patient_gender', row.gender || '');
    setValue('patient_date_of_birth', formatDob(row.date_of_birth));
    setValue('patient_city', row.city || '');
    setValue('patient_state_id', row.state_id || '');
    setValue('patient_city_id', row.city_id || '');
    setValue('patient_address', row.address || '');
    toast.success('Patient linked');
  };

  const handleClearPatient = () => {
    setLinkedPatient(null);
    setValue('patient_user_id', '');
  };

  const onSubmit = async (data) => {
    if (!data.preferred_time) {
      toast.error('Select a time slot');
      return;
    }
    if (!data.patient_user_id) {
      if (!data.patient_phone?.trim()) {
        toast.error('Phone is required for new patients');
        return;
      }
      if (
        !data.patient_gender ||
        !data.patient_date_of_birth ||
        !(data.patient_city?.trim() || data.patient_city_id)
      ) {
        toast.error('Gender, date of birth, and city are required for new patients');
        return;
      }
    }
    try {
      await createAppointment(buildCreatePayload(data)).unwrap();
      toast.success('Appointment created successfully');
      router.push('/appointments');
    } catch (error) {
      const detail = error?.data?.detail;
      toast.error(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(', ')
            : 'Failed to create appointment',
      );
    }
  };

  if (!canCreate) {
    return (
      <AccessDenied
        title="Access denied"
        message="You need appointment create permission to open this page."
      />
    );
  }

  return (
    <FormPageLayout
      title="Add Appointment"
      breadcrumbs={[
        { label: 'Appointments', href: '/appointments' },
        { label: 'Add New' },
      ]}
      cancelHref="/appointments"
      maxWidth="md"
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <FormCompactCard
          footer={(
            <FormActions inline>
              <Button
                color="primary"
                type="submit"
                isLoading={isLoading || isSubmitting}
                startContent={!isLoading && !isSubmitting && <Save className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Create Appointment
              </Button>
            </FormActions>
          )}
        >
          <FormSectionCard embedded title="Patient">
            <div className="space-y-3 mb-3">
              <p className="text-sm text-gray-600">
                Search by email or phone to link an existing patient (avoids duplicates).
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  aria-label="Search patient"
                  placeholder="Email or phone…"
                  value={searchQ}
                  onChange={(eOrValue) => {
                    const next =
                      typeof eOrValue === 'string'
                        ? eOrValue
                        : eOrValue?.target?.value ?? '';
                    setSearchQ(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  startContent={<Search className="w-4 h-4 text-gray-400" />}
                  className="flex-1"
                />
                <Button
                  color="primary"
                  variant="flat"
                  type="button"
                  onPress={handleSearch}
                  isLoading={searching}
                  className="shrink-0"
                >
                  Search
                </Button>
              </div>
              {searchError ? (
                <p className="text-sm text-danger">Search failed. Try again.</p>
              ) : null}
              {linkedPatient ? (
                <div className="flex items-start justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50/40 px-3 py-2">
                  <div className="min-w-0">
                    <Chip size="sm" color="primary" variant="flat" className="mb-1">
                      Linked account
                    </Chip>
                    <p className="text-sm font-medium truncate">{linkedPatient.display_name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[linkedPatient.email, linkedPatient.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button size="sm" variant="light" type="button" onPress={handleClearPatient}>
                    Clear
                  </Button>
                </div>
              ) : null}
              {searchResults.length > 0 && !linkedPatient ? (
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {searchResults.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectPatient(row)}
                        className="w-full text-left rounded-lg border border-gray-200 px-3 py-2 hover:border-primary-400 hover:bg-primary-50/40"
                      >
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{row.display_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {[row.email, row.phone].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!linkedPatient ? (
                <p className="text-xs text-gray-500">
                  No match? Fill details below to create as a new / guest patient.
                </p>
              ) : null}
            </div>
            <FormRow columns={2}>
              <FormInput name="patient_name" label="Full name" isRequired />
              <FormInput name="patient_email" label="Email" type="email" isRequired />
              <FormInput name="patient_phone" label="Phone" type="tel" />
              <FormSelect name="patient_gender" label="Gender" placeholder="Select">
                <SelectItem key="female" value="female">Female</SelectItem>
                <SelectItem key="male" value="male">Male</SelectItem>
                <SelectItem key="other" value="other">Other</SelectItem>
                <SelectItem key="prefer_not_to_say" value="prefer_not_to_say">
                  Prefer not to say
                </SelectItem>
              </FormSelect>
              <FormInput name="patient_date_of_birth" label="Date of birth" type="date" />
              <div className="sm:col-span-2">
                <IndiaStateCityFields
                  stateIdField="patient_state_id"
                  cityIdField="patient_city_id"
                  cityNameField="patient_city"
                  stateNameField="patient_state_name"
                  isRequired={!linkedPatient}
                />
              </div>
              <div className="sm:col-span-2">
                <FormInput name="patient_address" label="Address" />
              </div>
            </FormRow>
          </FormSectionCard>

          <FormDivider />

          <FormSectionCard embedded title="Booking">
            <FormRow columns={2}>
              <FormSelect
                name="doctor_id"
                label="Doctor"
                placeholder="Select doctor"
                isRequired
                isDisabled={!canReadDoctors}
              >
                {doctors.map((doctor) => {
                  const id = doctor.user_id || doctor.id;
                  const name =
                    doctor.name ||
                    `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() ||
                    doctor.email ||
                    String(id);
                  return (
                    <SelectItem key={id} value={id} textValue={name}>
                      {name}
                    </SelectItem>
                  );
                })}
              </FormSelect>
              <FormSelect name="consultation_mode" label="Mode" isRequired>
                <SelectItem key="in_person" value="in_person" textValue="In-clinic">
                  In-clinic
                </SelectItem>
                <SelectItem key="online" value="online" textValue="Online">
                  Online
                </SelectItem>
              </FormSelect>
              <FormSelect
                name="service_id"
                label="Service"
                placeholder={doctorId ? 'Select service' : 'Select doctor first'}
                isRequired
                isDisabled={!doctorId || loadingServices}
              >
                {serviceList.map((svc) => (
                  <SelectItem
                    key={svc.service_id}
                    value={svc.service_id}
                    textValue={svc.name || svc.service_id}
                  >
                    {svc.name || svc.service_id}
                  </SelectItem>
                ))}
              </FormSelect>
              {mode === 'online' ? (
                <FormSelect name="media_mode" label="Media" placeholder="Video">
                  <SelectItem key="video" value="video">Video</SelectItem>
                  <SelectItem key="audio" value="audio">Audio</SelectItem>
                </FormSelect>
              ) : null}
              <FormInput name="preferred_date" type="date" label="Date" isRequired />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700">Time slot</p>
                {!serviceId || !preferredDate ? (
                  <p className="text-xs text-gray-500">Pick doctor, service, and date for slots.</p>
                ) : loadingSlots ? (
                  <Spinner size="sm" />
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-danger">No open slots for this date.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableSlots.map((slot) => {
                      const t = toTimeInput(slot.start_time);
                      const selected = preferredTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setValue('preferred_time', t, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          className={cn(
                            'px-2.5 py-1.5 text-xs rounded-lg border font-medium',
                            selected
                              ? 'border-primary-500 bg-primary-50 text-primary-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700',
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </FormRow>
            <div className="mt-3">
              <FormTextarea name="special_notes" label="Notes" minRows={2} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div>
                <p className="text-xs text-gray-500">Clinic</p>
                <p className="font-medium text-gray-900">{CLINIC_LABEL}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fee preview</p>
                <p className="font-medium text-gray-900">
                  {feePreview != null && !Number.isNaN(feePreview)
                    ? `₹${feePreview.toLocaleString('en-IN')}`
                    : '—'}
                </p>
                <p className="text-[11px] text-gray-400">Collected via invoice after the visit</p>
              </div>
            </div>
          </FormSectionCard>
        </FormCompactCard>
      </Form>
    </FormPageLayout>
  );
}
