/**
 * Confirm Modal Component
 * Reusable confirmation dialog with mobile-first design
 */

'use client';

import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from '@heroui/react';

const iconMap = {
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    danger: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' },
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onOpenChange,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'warning',
    isLoading = false,
}) {
    const { icon: IconComponent, color, bg } = iconMap[type] || iconMap.warning;

    const handleClose = () => {
        onClose?.();
        onOpenChange?.(false);
    };

    const getButtonColor = () => {
        switch (type) {
            case 'danger':
                return 'danger';
            case 'success':
                return 'success';
            case 'info':
                return 'primary';
            default:
                return 'warning';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="sm"
            placement="center"
            backdrop="opaque"
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.2, ease: "easeOut" },
                    },
                    exit: {
                        y: -20,
                        opacity: 0,
                        transition: { duration: 0.15, ease: "easeIn" },
                    },
                },
            }}
            classNames={{
                backdrop: "bg-black/50 backdrop-blur-sm",
                base: "border border-gray-200 bg-white shadow-xl",
            }}
        >
            <ModalContent>
                {(modalOnClose) => (
                    <>
                        <ModalHeader className="flex flex-col items-center gap-2 pt-6">
                            <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                                <IconComponent className={`w-6 h-6 ${color}`} />
                            </div>
                            <span className="text-lg font-semibold text-gray-900">{title}</span>
                        </ModalHeader>
                        <ModalBody className="text-center px-6">
                            <p className="text-gray-600">{message}</p>
                        </ModalBody>
                        <ModalFooter className="flex flex-col sm:flex-row gap-2 pb-6 px-6">
                            <Button
                                variant="flat"
                                onPress={() => {
                                    handleClose();
                                    modalOnClose();
                                }}
                                className="w-full sm:w-auto order-2 sm:order-1"
                                isDisabled={isLoading}
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                color={getButtonColor()}
                                onPress={onConfirm}
                                isLoading={isLoading}
                                className="w-full sm:w-auto order-1 sm:order-2"
                            >
                                {confirmLabel}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
