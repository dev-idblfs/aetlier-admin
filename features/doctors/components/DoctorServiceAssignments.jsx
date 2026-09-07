'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Spinner } from '@/lib/heroui';
import { toast } from 'react-hot-toast';

import {
    useGetDoctorServicesQuery,
    useGetServicesQuery,
    useUpdateDoctorServicesMutation,
} from '@/redux/services/api';
import { FormCompactCard, FormSectionCard, FormActions } from '@/components/ui';
import { normalizeApiList } from '@/utils/normalizeApiList';

export default function DoctorServiceAssignments({ doctorId }) {
    const {
        data: servicesData,
        isLoading: loadingServices,
        isError: servicesError,
    } = useGetServicesQuery();
    const {
        data: assignedData,
        isLoading: loadingAssigned,
        isError: assignedError,
        error: assignedErr,
        refetch,
    } = useGetDoctorServicesQuery(doctorId, { skip: !doctorId });
    const [updateDoctorServices, { isLoading: saving }] = useUpdateDoctorServicesMutation();

    const allServices = useMemo(() => normalizeApiList(servicesData), [servicesData]);
    const assigned = useMemo(() => normalizeApiList(assignedData), [assignedData]);

    const [selected, setSelected] = useState({});

    useEffect(() => {
        const map = {};
        assigned.forEach((item) => {
            const sid = item.service_id || item.id;
            if (!sid) return;
            map[sid] = {
                supports_online: item.supports_online ?? true,
                supports_in_person: item.supports_in_person ?? true,
            };
        });
        setSelected(map);
    }, [assigned]);

    const handleToggle = (serviceId, checked) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (checked) {
                next[serviceId] = {
                    supports_online: true,
                    supports_in_person: true,
                };
            } else {
                delete next[serviceId];
            }
            return next;
        });
    };

    const handleModeToggle = (serviceId, field, value) => {
        setSelected((prev) => {
            if (!prev[serviceId]) return prev;
            return {
                ...prev,
                [serviceId]: {
                    ...prev[serviceId],
                    [field]: value,
                },
            };
        });
    };

    const handleSave = async () => {
        try {
            const assignments = Object.entries(selected).map(([service_id, modes]) => ({
                service_id,
                supports_online: Boolean(modes.supports_online),
                supports_in_person: Boolean(modes.supports_in_person),
            }));
            await updateDoctorServices({ doctorId, assignments }).unwrap();
            toast.success('Service assignments saved');
            refetch();
        } catch (error) {
            const detail = error?.data?.detail;
            toast.error(
                typeof detail === 'string'
                    ? detail
                    : 'Failed to save service assignments'
            );
        }
    };

    if (loadingServices || loadingAssigned) {
        return (
            <FormCompactCard>
                <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                </div>
            </FormCompactCard>
        );
    }

    if (servicesError || assignedError) {
        return (
            <FormCompactCard>
                <FormSectionCard embedded title="Services offered">
                    <p className="text-sm text-red-600">
                        {assignedErr?.data?.detail
                            || 'Could not load doctor services. Deploy the doctor-services API if this persists.'}
                    </p>
                </FormSectionCard>
            </FormCompactCard>
        );
    }

    return (
        <FormCompactCard
            footer={(
                <FormActions inline>
                    <Button
                        color="primary"
                        size="sm"
                        isLoading={saving}
                        onPress={handleSave}
                        className="w-full sm:w-auto"
                    >
                        Save services
                    </Button>
                </FormActions>
            )}
        >
            <FormSectionCard
                embedded
                title="Services offered"
                description="Select treatments this doctor performs. Online Consultation is online-only; other services are typically in-clinic. Modes can be adjusted per service."
            >
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg max-h-96 overflow-y-auto">
                    {allServices.length === 0 ? (
                        <p className="text-sm text-gray-500 p-3">No active services found.</p>
                    ) : (
                        allServices.map((service) => {
                            const serviceId = service.id;
                            const isOn = Boolean(selected[serviceId]);
                            const modes = selected[serviceId] || {};
                            return (
                                <div key={serviceId} className="p-3 hover:bg-gray-50/80">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            aria-label={service.name}
                                            isSelected={isOn}
                                            onValueChange={(v) => handleToggle(serviceId, v)}
                                            classNames={{ base: 'mt-0.5' }}
                                        >
                                            <span className="min-w-0">
                                                <span className="text-sm font-medium text-gray-900 block">
                                                    {service.name}
                                                </span>
                                                {service.category && (
                                                    <span className="text-xs text-gray-500">
                                                        {service.category}
                                                    </span>
                                                )}
                                            </span>
                                        </Checkbox>
                                    </div>
                                    {isOn && (
                                        <div className="flex flex-wrap gap-4 pl-8 pt-2">
                                            <Checkbox
                                                size="sm"
                                                isSelected={Boolean(modes.supports_in_person)}
                                                onValueChange={(v) =>
                                                    handleModeToggle(serviceId, 'supports_in_person', v)
                                                }
                                            >
                                                In-clinic
                                            </Checkbox>
                                            <Checkbox
                                                size="sm"
                                                isSelected={Boolean(modes.supports_online)}
                                                onValueChange={(v) =>
                                                    handleModeToggle(serviceId, 'supports_online', v)
                                                }
                                            >
                                                Online
                                            </Checkbox>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </FormSectionCard>
        </FormCompactCard>
    );
}
