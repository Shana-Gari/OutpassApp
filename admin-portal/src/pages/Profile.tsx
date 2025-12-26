
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../services/api';

export default function Profile() {
    const { userId, logout } = useAuthStore();
    const [user, setUser] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (userId) {
            api.get(`/users/${userId}/`)
                .then(res => setUser(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false); // If no userId, stop loading and show no user data
        }
    }, [userId]);

    if (loading) return <div>Loading profile...</div>;
    if (!user) return <div>No user data found.</div>; // Handle case where user is null after loading

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">My Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-lg">{user?.first_name} {user?.last_name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <p className="text-lg">{user?.role}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Phone</label>
                            <p className="text-lg">{user?.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-lg">{user?.email || '-'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Update Profile</Button>
                <Button variant="destructive" onClick={logout}>Logout</Button>
            </div>
        </div>
    );
}
