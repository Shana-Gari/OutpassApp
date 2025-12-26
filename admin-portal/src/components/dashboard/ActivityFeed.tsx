import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns';

export function ActivityFeed() {
    const { data: logs } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => (await api.get('/audit/logs/')).data
    });

    const activities = logs?.results || logs || [];

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {activities.length === 0 ? <p className="text-gray-500 text-sm">No recent activity.</p> :
                        activities.slice(0, 10).map((activity: any) => (
                            <div key={activity.id} className="flex items-start pb-4 border-b last:border-0 last:pb-0 border-slate-100">
                                {/* Simplified Avatar */}
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-xs font-semibold text-slate-600">
                                    {(activity.user_name || 'Sys').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        <span className="font-semibold text-slate-800">{activity.user_name || 'System'}</span> {activity.action.toLowerCase()} <span className="font-semibold text-blue-600">{activity.model_name}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    )
}
