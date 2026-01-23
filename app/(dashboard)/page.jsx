/**
 * Admin Dashboard Home Page
 * Mobile-first responsive design
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import {
    Calendar,
    Users,
    UserCog,
    Briefcase,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';
import { PageHeader, StatsCard, Card, CardTitle, CardContent } from '@/components/ui';
import { useGetAppointmentsQuery, useGetUsersQuery, useGetDoctorsQuery } from '@/redux/services/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
    const { data: appointmentsData, isLoading: loadingAppointments } = useGetAppointmentsQuery({ size: 100 });
    const { data: usersData } = useGetUsersQuery({ size: 1 });
    const { data: doctorsData } = useGetDoctorsQuery({ size: 1 });

    const appointments = appointmentsData?.appointments || [];

    // Calculate stats
    const stats = {
        totalAppointments: appointmentsData?.total || appointments.length,
        pendingAppointments: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
        confirmedAppointments: appointments.filter(a => a.status?.toLowerCase() === 'confirmed').length,
        completedAppointments: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
        totalUsers: usersData?.total || 0,
        totalDoctors: doctorsData?.total || 0,
    };

    // Recent appointments
    const recentAppointments = appointments.slice(0, 5);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 md:space-y-6"
        >
            <motion.div variants={itemVariants}>
                <PageHeader
                    title="Dashboard"
                    description="Welcome back! Here's an overview of your platform."
                />
            </motion.div>

            {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
            >
                <StatsCard
                    title="Appointments"
                    value={stats.totalAppointments}
                    icon={Calendar}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Pending"
                    value={stats.pendingAppointments}
                    icon={Clock}
                    iconBg="bg-amber-100"
                    iconColor="text-amber-600"
                />
                <StatsCard
                    title="Users"
                    value={stats.totalUsers}
                    icon={Users}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Doctors"
                    value={stats.totalDoctors}
                    icon={UserCog}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                />
            </motion.div>

            {/* Main Content Grid - Stack on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Recent Appointments */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle>Recent Appointments</CardTitle>
                            <Link
                                href="/appointments"
                                className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                            >
                                View all
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <CardContent>
                            {recentAppointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No appointments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentAppointments.map((apt) => (
                                        <motion.div
                                            key={apt.id}
                                            variants={itemVariants}
                                            className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                                                        {apt.service_name || apt.service?.name || 'Service'}
                                                    </p>
                                                    <p className="text-xs md:text-sm text-gray-500 truncate">
                                                        {apt.patient_info?.full_name || apt.user?.name || 'Patient'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className="text-xs md:text-sm font-medium text-gray-900">
                                                    {apt.appointment_date || apt.preferred_date}
                                                </p>
                                                <p className={`text-xs capitalize ${apt.status === 'confirmed' ? 'text-green-600' :
                                                    apt.status === 'pending' ? 'text-amber-600' :
                                                        'text-gray-500'
                                                    }`}>
                                                    {apt.status}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardContent className="mt-4 space-y-2 md:space-y-3">
                            <QuickAction
                                href="/appointments"
                                icon={Calendar}
                                label="Appointments"
                                count={stats.pendingAppointments}
                                countLabel="pending"
                            />
                            <QuickAction
                                href="/users"
                                icon={Users}
                                label="Users"
                            />
                            <QuickAction
                                href="/doctors"
                                icon={UserCog}
                                label="Doctors"
                            />
                            <QuickAction
                                href="/services"
                                icon={Briefcase}
                                label="Services"
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

function QuickAction({ href, icon: Icon, label, count, countLabel }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-primary-600" />
                </div>
                <span className="font-medium text-sm md:text-base text-gray-900">{label}</span>
            </div>
            {count !== undefined && (
                <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                    {count}
                </span>
            )}
        </Link>
    );
}
