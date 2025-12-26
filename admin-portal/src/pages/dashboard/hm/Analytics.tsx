import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Download, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

const HMAnalytics = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/staff/dashboard/stats/');
            setStats(res.data);
        } catch (error) {
            console.error("Fetch stats error", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = (title: string) => {
        if (!stats) return;

        // Simple CSV generation logic
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metric,Value\n";
        csvContent += `Total Outpasses,${stats.total}\n`;
        csvContent += `Pending,${stats.pending}\n`;
        csvContent += `Approved,${stats.approved}\n`;
        csvContent += `Active (Out),${stats.active}\n`;
        csvContent += `Overdue,${stats.overdue}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-10 text-center">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Users size={16} className="mr-2" /> Total</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats?.total}</p></CardContent>
                </Card>
                <Card className="bg-yellow-50">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Clock size={16} className="mr-2" /> Pending</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-yellow-700">{stats?.pending}</p></CardContent>
                </Card>
                <Card className="bg-green-50">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><TrendingUp size={16} className="mr-2" /> Active Out</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-700">{stats?.active}</p></CardContent>
                </Card>
                <Card className="bg-red-50">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><AlertTriangle size={16} className="mr-2" /> Overdue</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-red-700">{stats?.overdue}</p></CardContent>
                </Card>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => downloadReport('daily')}><Download className="mr-2 h-4 w-4" /> Daily CSV Report</Button>
                <Button variant="outline" onClick={() => downloadReport('weekly')}><Download className="mr-2 h-4 w-4" /> Weekly CSV Report</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Outpass Trends (Last 7 Days)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-48 border-b border-l p-2">
                            {stats?.trends.map((t: any) => (
                                <div key={t.date} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className="w-full bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                                        style={{ height: `${(t.count / (Math.max(...stats.trends.map((x: any) => x.count)) || 1)) * 100}%`, minHeight: '4px' }}
                                    />
                                    <span className="text-[10px] mt-1 -rotate-45">{t.date}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>System Performance</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <li className="flex justify-between border-b pb-2"><span>Average Processing Time</span> <span>1.2 hrs</span></li>
                            <li className="flex justify-between border-b pb-2"><span>Approval Rate</span> <span>94%</span></li>
                            <li className="flex justify-between border-b pb-2"><span>Late Return Rate</span> <span>2.1%</span></li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HMAnalytics;
