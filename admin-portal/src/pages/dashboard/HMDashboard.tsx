
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import Modal from '../../components/Modal'; // Making sure path is correct relative to pages/dashboard
import { Calendar, MapPin, Phone, ArrowRight, AlertCircle, Clock } from 'lucide-react';

const HMDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Meeting modal
    const [meetingDialog, setMeetingDialog] = useState<{ open: boolean, op: any | null }>({ open: false, op: null });
    const [meetingForm, setMeetingForm] = useState({ date: '', time: '', venue: '', reason: '' });

    // Reject modal
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchOutpasses(activeTab);
    }, [activeTab]);

    const fetchOutpasses = async (tab: string) => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let url = `/staff/dashboard/?`;

            if (tab === 'pending') url += `status=pending`; // Backend default
            if (tab === 'approved') url += `status=approved`;
            if (tab === 'meeting') url += `status=meeting`;
            if (tab === 'returned') url += `status=returned&date=${today}`;
            if (tab === 'not_returned') url += `status=not_returned&date=${today}`;

            const res = await api.get(url);
            setOutpasses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Approve this outpass?")) return;
        try {
            await api.post(`/staff/dashboard/${id}/hm/approve/`);
            fetchOutpasses(activeTab);
        } catch (err) {
            alert("Failed to approve");
        }
    };

    const handleRejectClick = (id: string) => {
        setRejectDialog({ open: true, id });
        setRejectReason('');
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason) return alert("Reason required");
        try {
            await api.post(`/staff/dashboard/${rejectDialog.id}/hm/reject/`, { reason: rejectReason });
            setRejectDialog({ open: false, id: null });
            fetchOutpasses(activeTab);
        } catch (err) {
            alert("Failed to reject");
        }
    };

    const handleMeetingClick = (op: any) => {
        setMeetingDialog({ open: true, op });
        setMeetingForm({ date: '', time: '', venue: '', reason: '' });
    };

    const handleMeetingConfirm = async () => {
        if (!meetingForm.date || !meetingForm.time || !meetingForm.venue) return alert("Fields required");
        try {
            const dateTime = `${meetingForm.date}T${meetingForm.time}`; // Simplistic
            await api.post(`/staff/dashboard/${meetingDialog.op.id}/hm/meeting/`, {
                date: new Date(dateTime).toISOString(), // Ensure ISO
                venue: meetingForm.venue,
                reason: meetingForm.reason
            });
            setMeetingDialog({ open: false, op: null });
            fetchOutpasses(activeTab);
        } catch (err) {
            alert("Failed to schedule meeting");
        }
    };

    const renderCard = (op: any) => (
        <Card key={op.id} className={`border-t-4 ${op.is_priority ? 'border-red-500' : 'border-blue-500'}`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{op.student_name}</CardTitle>
                        <p className="text-sm text-gray-500">Class: {op.student_class} | Roll: {op.student_roll_no}</p>
                    </div>
                    {op.is_priority && <Badge variant="destructive">Priority</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} /> <span className="truncate">{op.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>
                        Out: {op.outgoing_date} {op.outgoing_time.substring(0, 5)} <br />
                        In: {op.expected_return_date} {op.expected_return_time.substring(0, 5)}
                    </span>
                </div>
                <div className="bg-gray-50 p-2 rounded text-gray-700 italic border">
                    "{op.reason}"
                </div>

                {activeTab === 'pending' && (
                    <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(op.id)}>
                            Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleMeetingClick(op)}>
                            Meeting
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleRejectClick(op.id)}>
                            Reject
                        </Button>
                    </div>
                )}
                {activeTab === 'meeting' && (
                    <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-800">Meeting Scheduled</p>
                        <p>Date: {new Date(op.meeting_date).toLocaleDateString()} {new Date(op.meeting_date).toLocaleTimeString()}</p>
                        <p>Venue: {op.meeting_venue}</p>
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            <Button size="sm" variant="outline">Cancel</Button>
                        </div>
                    </div>
                )}
                {activeTab === 'not_returned' && (
                    <div className="mt-2">
                        <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                            <Phone size={14} className="mr-2" /> Contact Parent
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Quick Links Header */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                <Button variant="outline" className="h-24 w-32 flex flex-col gap-2 items-center justify-center border-2 border-dashed hover:border-blue-500 hover:bg-blue-50" onClick={() => navigate('/hm/priority')}>
                    <AlertCircle className="text-red-500" />
                    Priority
                </Button>
                <Button variant="outline" className="h-24 w-32 flex flex-col gap-2 items-center justify-center border-2 border-dashed hover:border-blue-500 hover:bg-blue-50" onClick={() => navigate('/hm/history')}>
                    <Clock className="text-gray-500" />
                    History
                </Button>
                <Button variant="outline" className="h-24 w-32 flex flex-col gap-2 items-center justify-center border-2 border-dashed hover:border-blue-500 hover:bg-blue-50" onClick={() => navigate('/hm/analytics')}>
                    <ArrowRight className="text-blue-500" />
                    Analytics
                </Button>
            </div>

            <h1 className="text-2xl font-bold">Today's Outpass Requests</h1>

            <Tabs defaultValue="pending" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="meeting">Meeting</TabsTrigger>
                    <TabsTrigger value="returned">Returned</TabsTrigger>
                    <TabsTrigger value="not_returned">Not Returned</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {loading ? (
                        <div className="text-center py-10">Loading requests...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {outpasses.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No requests found in this category.</p>}
                            {outpasses.map(renderCard)}
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Modals */}
            <Modal isOpen={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} title="Reject Request">
                <div className="space-y-4">
                    <p>Reason for rejection:</p>
                    <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason..." />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRejectConfirm}>Reject</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={meetingDialog.open} onClose={() => setMeetingDialog({ open: false, op: null })} title="Schedule Meeting">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Date</label>
                            <Input type="date" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm">Time</label>
                            <Input type="time" value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm">Venue</label>
                        <Input value={meetingForm.venue} onChange={e => setMeetingForm({ ...meetingForm, venue: e.target.value })} placeholder="e.g. Principal Office" />
                    </div>
                    <div>
                        <label className="text-sm">Reason</label>
                        <Input value={meetingForm.reason} onChange={e => setMeetingForm({ ...meetingForm, reason: e.target.value })} placeholder="Reason for meeting" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setMeetingDialog({ open: false, op: null })}>Cancel</Button>
                        <Button onClick={handleMeetingConfirm}>Schedule</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default HMDashboard;
