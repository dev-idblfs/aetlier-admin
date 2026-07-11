'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';

import {
    useGetDoctorServicesQuery,
    useGetServicesQuery,
    useUpdateDoctorServicesMutation,
} from '@/redux/services/api';
import { FormCompactCard, FormSectionCard } from '@/components/ui';

export default function DoctorServiceAssignments({ doctorId }) {
    const { data: allServices = [], isLoading: loadingServices } = useGetServicesQuery({
        active_only: true,
    });
    const { data: assigned = [], isLoading: loadingAssigned, refetch } =
        useGetDoctorServicesQuery(doctorId, { skip: !doctorId });
    const [updateDoctorServices, { isLoading: saving }] = useUpdateDoctorServicesMutation();

    const [selected, setSelected] = useState({});

    useEffect(() => {
        const map = {};
        (assigned || []).forEach((item) => {
            map[item.service_id] = {
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
        setSelected((prev) => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        try {
            const assignments = Object.entries(selected).map(([service_id, modes]) => ({
                service_id,
                supports_online: modes.supports_online,
                supports_in_person: modes.supports_in_person,
            }));
            await updateDoctorServices({ doctorId, assignments }).unwrap();
            toast.success('Service assignments saved');
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to save service assignments');
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

    return (
        <FormCompactCard>
            <FormSectionCard
                embedded
                title="Services offered"
                description="Select treatments this doctor can perform and consultation modes."
            >
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allServices.map((service) => {
                        const isOn = Boolean(selected[service.id]);
                        const modes = selected[service.id] || {};
                        return (
                            <div
                                key={service.id}
                                className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg"
                            >
                                <Checkbox
                                    isSelected={isOn}
                                    onValueChange={(v) => handleToggle(service.id, v)}
                                >
                                    <span className="text-sm font-medium">{service.name}</span>
                                    {service.category && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            {service.category}
                                        </span>
                                    )}
                                </Checkbox>
                                {isOn && (
                                    <div className="flex gap-4 pl-6">
                                        <Checkbox
                                            size="sm"
                                            isSelected={modes.supports_in_person}
                                            onValueChange={(v) =>
                                                handleModeToggle(service.id, 'supports_in_person', v)
                                            }
                                        >
                                            In-clinic
                                        </Checkbox>
                                        <Checkbox
                                            size="sm"
                                            isSelected={modes.supports_online}
                                            onValueChange={(v) =>
                                                handleModeToggle(service.id, 'supports_online', v)
                                            }
                                        >
                                            Online
                                        </Checkbox>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button color="primary" size="sm" isLoading={saving} onPress={handleSave}>
                        Save services
                    </Button>
                </div>
            </FormSectionCard>
        </FormCompactCard>
    );
}
