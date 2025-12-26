import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Info, Download } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Staff() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<any>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        role: 'WARDEN',
        password: '',
        assigned_hostel: ''
    });

    const queryClient = useQueryClient();

    // Fetch all users with staff roles
    const { data: staffMembers, isLoading } = useQuery({
        queryKey: ['staff', search],
        queryFn: async () => {
            const res = await api.get('/users/?search=' + search);
            return res.data;
        }
    });

    const filteredStaff = staffMembers?.filter((u: any) =>
        ['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF'].includes(u.role)
    );

    // Fetch Hostels for Warden assignment
    const { data: hostels } = useQuery({
        queryKey: ['hostels'],
        queryFn: async () => (await api.get('/hostels/')).data
    });

    // Effect to prepopulate form
    useEffect(() => {
        if (selectedStaffForEdit) {
            setFormData({
                first_name: selectedStaffForEdit.first_name || '',
                last_name: selectedStaffForEdit.last_name || '',
                phone: selectedStaffForEdit.phone || '',
                email: selectedStaffForEdit.email || '',
                role: selectedStaffForEdit.role || 'WARDEN',
                password: '', // Don't fill password
                assigned_hostel: selectedStaffForEdit.assigned_hostel || ''
            });
        } else {
            setFormData({
                first_name: '', last_name: '', phone: '', email: '',
                role: 'WARDEN', password: '', assigned_hostel: ''
            });
        }
    }, [selectedStaffForEdit]);

    const createMutation = useMutation({
        mutationFn: (data: any) => {
            const payload = { ...data };
            if (payload.role !== 'WARDEN') delete (payload as any).assigned_hostel;
            if (!payload.password) delete (payload as any).password;

            if (selectedStaffForEdit) {
                return api.patch(`/users/${selectedStaffForEdit.id}/`, payload);
            }
            return api.post('/users/', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setIsModalOpen(false);
            setSelectedStaffForEdit(null);
            alert(selectedStaffForEdit ? 'Staff updated!' : 'Staff created!');
        },
        onError: (err) => alert('Failed: ' + JSON.stringify(err))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (err: any) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/export/?type=staff', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'staff.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data");
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={() => {
                            setSelectedStaffForEdit(null);
                            setFormData({
                                first_name: '',
                                last_name: '',
                                phone: '',
                                email: '',
                                role: 'WARDEN',
                                password: '',
                                assigned_hostel: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> Add Staff
                    </button>
                </div>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search staff..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Password (Default) <span title="Showing default password (Email or Phone). If user changed it, this value is invalid." className="cursor-help"><Info size={14} className="inline" /></span>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStaff?.map((staff: any) => (
                            <tr key={staff.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{staff.first_name} {staff.last_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${staff.role === 'HM' ? 'bg-purple-100 text-purple-800' :
                                            staff.role === 'WARDEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {staff.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all">
                                            {staff.phone}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            (Initial)
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => { setSelectedStaffForEdit(staff); setIsModalOpen(true); }}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Delete staff member?')) deleteMutation.mutate(staff.id); }}
                                        className="text-red-600 hover:text-red-900 inline-flex"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedStaffForEdit ? "Edit Staff" : "Add New Staff"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input name="first_name" value={formData.first_name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input name="last_name" value={formData.last_name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Staff Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                            <option value="WARDEN">Warden</option>
                            <option value="HM">HM/Principal</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="GATE_STAFF">Gate Staff</option>
                        </select>
                    </div>

                    {formData.role === 'WARDEN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Assigned Hostel</label>
                            <select name="assigned_hostel" value={(formData as any).assigned_hostel} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                                <option value="">-- Select Hostel --</option>
                                {hostels?.map((h: any) => (
                                    <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" placeholder={selectedStaffForEdit ? "Leave blank to keep current" : "Default is phone number"} />
                        <p className="text-[10px] text-gray-400 mt-1">Initial password is the phone number unless specified.</p>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {createMutation.isPending ? 'Saving...' : (selectedStaffForEdit ? 'Update Staff' : 'Create Staff')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
