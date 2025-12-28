import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';

const AccountantDashboard = () => {
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOutpass, setSelectedOutpass] = useState<any>(null);
    const [feeAmount, setFeeAmount] = useState('');
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

    useEffect(() => {
        fetchOutpasses();
    }, []);

    const fetchOutpasses = async () => {
        try {
            const response = await api.get('/staff/dashboard/');
            setOutpasses(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching outpasses", error);
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.post(`/staff/dashboard/${id}/accountant/approve/`);
            fetchOutpasses();
        } catch (error) {
            console.error("Error approving", error);
            alert("Failed to approve");
        }
    };

    const handleOpenFeeModal = (outpass: any) => {
        setSelectedOutpass(outpass);
        setIsFeeModalOpen(true);
        setFeeAmount('');
    };

    const handleMarkFeePending = async () => {
        if (!selectedOutpass || !feeAmount) return;
        try {
            await api.post(`/staff/dashboard/${selectedOutpass.id}/accountant/fee-pending/`, {
                amount: feeAmount
            });
            setIsFeeModalOpen(false);
            fetchOutpasses();
        } catch (error) {
            console.error("Error marking fee pending", error);
            alert("Failed to mark fee pending");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold">Accountant Dashboard</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outpasses.map((op: any) => (
                                <TableRow key={op.id}>
                                    <TableCell>{op.student_name} ({op.student_roll_no})</TableCell>
                                    <TableCell>{op.student_class}</TableCell>
                                    <TableCell>{op.reason}</TableCell>
                                    <TableCell>{op.outgoing_date} {op.outgoing_time}</TableCell>
                                    <TableCell>{op.status}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button size="sm" onClick={() => handleApprove(op.id)}>Approve (Paid)</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleOpenFeeModal(op)}>Fee Pending</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isFeeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
                        <h2 className="text-xl font-bold">Mark Fee Pending</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fee Amount Due</label>
                            <Input
                                type="number"
                                value={feeAmount}
                                onChange={(e) => setFeeAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsFeeModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleMarkFeePending}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantDashboard;
