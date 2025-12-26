import React, { useState, useEffect } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import Modal from '../components/Modal';
import { Check, X } from 'lucide-react';
import api from '../services/api';

export default function Guardians() {
    const [guardians, setGuardians] = useState([]);
    const [loading, setLoading] = useState(true);

    // Reject Dialog
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchGuardians();
    }, []);

    const fetchGuardians = async () => {
        try {
            const res = await api.get('/guardians/');
            setGuardians(res.data);
        } catch (error) {
            console.error("Failed to fetch guardians", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!window.confirm("Are you sure you want to approve this guardian?")) return;
        try {
            await api.post(`/guardians/${id}/approve/`);
            fetchGuardians();
        } catch (error) {
            console.error(error);
            alert("Failed to approve");
        }
    };

    const handleRejectClick = (id: string) => {
        setRejectDialog({ open: true, id });
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason) return alert("Reason is required");
        try {
            await api.post(`/guardians/${rejectDialog.id}/reject/`, { reason: rejectReason });
            setRejectDialog({ open: false, id: null });
            setRejectReason('');
            fetchGuardians();
        } catch (error) {
            console.error(error);
            alert("Failed to reject");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Guardian Verification</h2>
            </div>

            <div className="bg-white rounded-lg shadow border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guardian Name</TableHead>
                            <TableHead>Relation</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Added By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guardians.map((g: any) => (
                            <TableRow key={g.id}>
                                <TableCell className="font-medium">{g.name}</TableCell>
                                <TableCell>{g.relationship}</TableCell>
                                <TableCell>{g.phone}</TableCell>
                                <TableCell>{g.student_name || `ID: ${g.student}`}</TableCell>
                                <TableCell>{g.added_by_name || `ID: ${g.added_by}`}</TableCell>
                                <TableCell>
                                    <Badge variant={g.is_approved ? "success" : "warning"}>
                                        {g.is_approved ? "Verified" : "Pending"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {!g.is_approved && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                                    onClick={() => handleApprove(g.id)}
                                                    title="Approve"
                                                >
                                                    <Check size={18} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                    onClick={() => handleRejectClick(g.id)}
                                                    title="Reject"
                                                >
                                                    <X size={18} />
                                                </Button>
                                            </>
                                        )}
                                        {g.is_approved && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRejectClick(g.id)}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {guardians.length === 0 && !loading && (
                            <TableRow><TableCell colSpan={7} className="text-center h-24">No guardians found</TableCell></TableRow>
                        )}
                        {loading && (
                            <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal
                isOpen={rejectDialog.open}
                onClose={() => setRejectDialog({ open: false, id: null })}
                title="Reject Guardian"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Please provide a reason for rejecting this guardian request.</p>
                    <Input
                        placeholder="Rejection Reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRejectConfirm}>Confirm Reject</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
