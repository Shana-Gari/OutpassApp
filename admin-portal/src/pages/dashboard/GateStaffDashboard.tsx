import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Send, LogOut, LogIn } from 'lucide-react';

const GateStaffDashboard = () => {
    const [qrInput, setQrInput] = useState('');
    const [scanResult, setScanResult] = useState<any>(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRecentLogs();
    }, []);

    const fetchRecentLogs = async () => {
        try {
            const res = await api.get('/staff/dashboard/');
            setRecentLogs(res.data);
        } catch (error) {
            console.error("Fetch logs error", error);
        }
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qrInput) return;
        setLoading(true);
        setScanResult(null);

        try {
            const res = await api.post('/staff/dashboard/gate/scan/', { qr_code: qrInput });
            setScanResult({ success: true, ...res.data });
            setQrInput('');
            fetchRecentLogs();
        } catch (error: any) {
            console.error("Scan error", error);
            setScanResult({
                success: false,
                error: error.response?.data?.error || "Scan failed"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gate Station</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scanner Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Scan QR Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleScan} className="flex gap-2">
                            <Input
                                autoFocus
                                value={qrInput}
                                onChange={(e) => setQrInput(e.target.value)}
                                placeholder="Scan or enter QR code here..."
                                className="text-lg py-6"
                            />
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? 'Scanning...' : <Send />}
                            </Button>
                        </form>

                        {scanResult && (
                            <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center ${scanResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {scanResult.success ? (
                                    <>
                                        {scanResult.type === 'EXIT' ? <LogOut size={48} className="text-green-600 mb-2" /> : <LogIn size={48} className="text-blue-600 mb-2" />}
                                        <h3 className="text-xl font-bold text-green-800">{scanResult.status}</h3>
                                        <p className="text-lg font-medium">{scanResult.student}</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-red-800">Error</h3>
                                        <p className="text-red-600">{scanResult.error}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Gate Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentLogs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No recent activity</TableCell></TableRow>}
                                {recentLogs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.student_name}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.status === 'CHECKED_OUT' ? 'warning' : 'success'}>
                                                {log.status === 'CHECKED_OUT' ? 'EXITED' : 'RETURNED'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.status === 'CHECKED_OUT'
                                                ? new Date(log.updated_at).toLocaleTimeString() // timestamp of checkout
                                                : new Date(log.updated_at).toLocaleTimeString()
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default GateStaffDashboard;
