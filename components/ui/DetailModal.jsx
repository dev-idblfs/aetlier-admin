/**
 * Detail Modal Component
 * Reusable modal for viewing item details
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
import { Edit } from 'lucide-react';

export default function DetailModal({
    isOpen,
    onOpenChange,
    onClose,
    onEdit,
    title = 'Details',
    children,
    showEdit = true,
    editLabel = 'Edit',
    size = 'lg',
    actions, // Custom actions to render in footer
}) {
    const handleClose = () => {
        onClose?.();
        onOpenChange?.(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size={size}
            scrollBehavior="inside"
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
                header: "border-b border-gray-100",
                body: "py-4",
                footer: "border-t border-gray-100",
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
                        <ModalFooter className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="flat"
                                onPress={() => {
                                    handleClose();
                                    modalOnClose();
                                }}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Close
                            </Button>
                            {/* Render custom actions if provided */}
                            {actions}
                            {/* Default edit button if onEdit is provided and no custom actions */}
                            {!actions && showEdit && onEdit && (
                                <Button
                                    color="primary"
                                    startContent={<Edit className="w-4 h-4" />}
                                    onPress={() => {
                                        modalOnClose();
                                        onEdit();
                                    }}
                                    className="w-full sm:w-auto order-1 sm:order-2"
                                >
                                    {editLabel}
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

/**
 * Detail Row Component
 * For displaying label-value pairs in detail modals
 */
export function DetailRow({ label, value, className = '' }) {
    return (
        <div className={className}>
            <span className="block text-sm text-gray-500 mb-1">{label}</span>
            <span className="text-gray-900">{value || 'N/A'}</span>
        </div>
    );
}

/**
 * Detail Grid Component
 * For laying out multiple DetailRows in a grid
 */
export function DetailGrid({ children, columns = 2, className = '' }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-4 ${className}`}>
            {children}
        </div>
    );
}
