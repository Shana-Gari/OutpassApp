
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

const HMPriority = () => {
    const [priorityOutpasses, setPriorityOutpasses] = useState([]);

    useEffect(() => {
        // Fetch logic ideally filters by is_priority=True
        // For now using all pending and filtering client side or adding a new param later
        // API doesn't explicitly have /staff/dashboard/?priority=true yet, but let's assume we use 'pending' and filter
        fetchPriority();
    }, []);

    const fetchPriority = async () => {
        try {
            const res = await api.get('/staff/dashboard/?priority=true');
            setPriorityOutpasses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Priority Requests</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityOutpasses.length === 0 && <p>No priority requests.</p>}
                {priorityOutpasses.map((op: any) => (
                    <Card key={op.id} className="border-l-4 border-red-500">
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                {op.student_name}
                                <Badge variant="destructive">Urgent</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">{op.student_class}</p>
                            <p className="font-medium mt-2">Reason:</p>
                            <p>{op.reason}</p>
                            {/* Add Actions here later */}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HMPriority;
