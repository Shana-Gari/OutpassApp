
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, FileCheck, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => (await api.get('/outpasses/stats/')).data
    });

    const { data: guardians, refetch: refetchGuardians } = useQuery({
        queryKey: ['pending-guardians'],
        queryFn: async () => (await api.get('/students/guardians/')).data
    });

    if (isLoading) return <div>Loading dashboard...</div>;

    const data = stats?.trends || [];

    const pendingGuardians = guardians?.filter((g: any) => !g.is_approved) || [];

    const handleApprove = async (id: string) => {
        if (!window.confirm("Approve this guardian?")) return;
        try {
            await api.post(`/students/guardians/${id}/approve/`);
            refetchGuardians();
        } catch (error) {
            console.error(error);
            alert("Failed to approve");
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await api.post(`/students/guardians/${id}/reject/`, { reason });
            refetchGuardians();
        } catch (error) {
            console.error(error);
            alert("Failed to reject");
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="bg-blue-500" />
                <StatCard title="Active Outpasses" value={stats?.active_outpasses || 0} icon={Clock} color="bg-green-500" />
                <StatCard title="Pending Outpasses" value={stats?.pending_approvals || 0} icon={FileCheck} color="bg-yellow-500" />
                <StatCard title="Overdue Returns" value={stats?.overdue_returns || 0} icon={AlertCircle} color="bg-red-500" />
            </div>

            {/* Pending Guardians Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Users className="mr-2 text-yellow-600" size={20} />
                        Pending Guardian Verifications
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {pendingGuardians.length} new
                        </span>
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/guardians'}>View All</Button>
                </div>

                {pendingGuardians.length === 0 ? (
                    <p className="text-gray-500 italic">No pending verifications.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Guardian</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Relation</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Added By</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingGuardians.map((g: any) => (
                                    <tr key={g.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{g.name}</td>
                                        <td className="px-4 py-3">{g.student_name}</td>
                                        <td className="px-4 py-3">{g.relationship}</td>
                                        <td className="px-4 py-3">{g.phone}</td>
                                        <td className="px-4 py-3 text-gray-500">{g.added_by_name}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 h-8"
                                                onClick={() => handleApprove(g.id)}
                                            >
                                                Verify
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-8"
                                                onClick={() => handleReject(g.id)}
                                            >
                                                Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Outpass Trends</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="pending" fill="#8884d8" name="Pending" />
                            <Bar dataKey="approved" fill="#82ca9d" name="Approved/Out" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
