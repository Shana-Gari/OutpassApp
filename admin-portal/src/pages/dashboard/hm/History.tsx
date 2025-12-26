import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../../../components/ui/table';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

const HMHistory = () => {
    const [outpasses, setOutpasses] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/staff/dashboard/?history=true');
            setOutpasses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const filtered = outpasses.filter((op: any) => {
        const matchStatus = filterStatus === 'all' || op.status === filterStatus;
        const matchSearch = op.student_name.toLowerCase().includes(search.toLowerCase()) ||
            (op.student_class && op.student_class.toLowerCase().includes(search.toLowerCase()));
        return matchStatus && matchSearch;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">History</h1>

            <div className="flex gap-4">
                <Input
                    placeholder="Search Name, Class..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />

                <select
                    className="border rounded px-3 py-2 bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Returned</option>
                    <option value="CHECKED_OUT">Not Returned</option>
                </select>
            </div>

            <div className="bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Out Date</TableHead>
                            <TableHead>Return Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((op: any) => (
                            <TableRow key={op.id}>
                                <TableCell>{op.student_name}</TableCell>
                                <TableCell>{op.reason}</TableCell>
                                <TableCell>{op.outgoing_date}</TableCell>
                                <TableCell>{op.expected_return_date}</TableCell>
                                <TableCell>{op.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default HMHistory;
