import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const WardenDashboard = () => {
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    // QR Code modal state
    const [generatedQR, setGeneratedQR] = useState<string | null>(null);

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

    const handleVacateHostel = async (id: string) => {
        // Optional: Capture live image here (omitted for now as requested optional)
        if (!confirm("Confirm student is vacating hostel?")) return;

        try {
            const response = await api.post(`/staff/dashboard/${id}/warden/vacate/`);
            if (response.data.qr_code) {
                setGeneratedQR(response.data.qr_code);
            }
            fetchOutpasses();
        } catch (error) {
            console.error("Error vacating", error);
            alert("Failed to confirm vacate");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6 relative">
            <h1 className="text-3xl font-bold">Warden Dashboard</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Ready for Exit (HM Approved)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>Exit Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outpasses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No approved requests pending exit</TableCell>
                                </TableRow>
                            )}
                            {outpasses.map((op: any) => (
                                <TableRow key={op.id}>
                                    <TableCell>{op.student_name} ({op.student_roll_no})</TableCell>
                                    <TableCell>{op.student_class}</TableCell>
                                    <TableCell>{op.destination}</TableCell>
                                    <TableCell>{op.outgoing_date} {op.outgoing_time}</TableCell>
                                    <TableCell>
                                        <Button onClick={() => handleVacateHostel(op.id)}>Vacated Hostel & Gen QR</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* QR Code Modal Display */}
            {generatedQR && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
                        <h2 className="text-2xl font-bold text-green-600">Gate Pass Generated</h2>
                        <div className="p-4 border-4 border-black">
                            {/* In real app, use a QRCode component. Here just text for simulation */}
                            <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-center break-all text-xs">
                                QR CODE:<br />{generatedQR.substring(0, 20)}...
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Scan this at the gate</p>
                        <Button onClick={() => setGeneratedQR(null)}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardenDashboard;
