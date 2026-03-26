/**
 * Form Modal Component
 * Reusable modal wrapper for forms with mobile-first design
 */

'use client';

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from '@heroui/react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function FormModal({
    isOpen,
    onOpenChange,
    onClose,
    onSubmit,
    title,
    children,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    isLoading = false,
    isDisabled = false,
    size = 'lg',
    showFooter = true,
    submitColor = 'primary',
    scrollBehavior = 'inside',
}) {
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleClose = () => {
        onClose?.();
        onOpenChange?.(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size={isMobile ? 'full' : size}
            scrollBehavior={scrollBehavior}
            placement={isMobile ? 'bottom' : 'center'}
            backdrop="opaque"
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            duration: isMobile ? 0.32 : 0.2,
                            ease: isMobile ? [0.22, 1, 0.36, 1] : 'easeOut',
                        },
                    },
                    exit: {
                        y: isMobile ? '100%' : -20,
                        opacity: isMobile ? 1 : 0,
                        transition: {
                            duration: isMobile ? 0.25 : 0.15,
                            ease: 'easeIn',
                        },
                    },
                },
            }}
            classNames={{
                backdrop: 'bg-black/50 backdrop-blur-sm',
                base: isMobile
                    ? 'rounded-t-2xl rounded-b-none m-0 max-h-[92vh] bg-white shadow-2xl border-0 w-full'
                    : 'border border-gray-200 bg-white shadow-xl',
                header: 'border-b border-gray-100',
                body: 'py-4',
                footer: 'border-t border-gray-100',
            }}
        >
            <ModalContent>
                {(modalOnClose) => (
                    <>
                        <ModalHeader className="text-lg font-semibold">
                            {title}
                        </ModalHeader>
                        <ModalBody>
                            {children}
                        </ModalBody>
                        {showFooter && (
                            <ModalFooter className="flex flex-col sm:flex-row gap-2">
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
                                    color={submitColor}
                                    onPress={onSubmit}
                                    isLoading={isLoading}
                                    isDisabled={isDisabled || isLoading}
                                    className="w-full sm:w-auto order-1 sm:order-2"
                                >
                                    {submitLabel}
                                </Button>
                            </ModalFooter>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
