import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Home } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Housing() {
    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [selectedHostelForEdit, setSelectedHostelForEdit] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'BOYS',
    });

    const queryClient = useQueryClient();

    // Fetch Hostels
    const { data: hostels, isLoading } = useQuery({
        queryKey: ['hostels'],
        queryFn: async () => (await api.get('/hostels/')).data
    });

    // Hook to prepopulate
    useEffect(() => {
        if (selectedHostelForEdit) {
            setFormData({
                name: selectedHostelForEdit.name || '',
                type: selectedHostelForEdit.type || 'BOYS',
            });
        } else {
            setFormData({ name: '', type: 'BOYS' });
        }
    }, [selectedHostelForEdit]);


    // Create/Update Hostel Mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => {
            if (selectedHostelForEdit) {
                return api.patch(`/hostels/${selectedHostelForEdit.id}/`, data);
            }
            return api.post('/hostels/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hostels'] });
            setIsHostelModalOpen(false);
            setSelectedHostelForEdit(null);
            alert(selectedHostelForEdit ? 'Hostel updated!' : 'Hostel created!');
        },
        onError: (err) => alert('Failed: ' + JSON.stringify(err))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/hostels/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hostels'] });
            alert('Hostel deleted!');
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

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Housing Management</h1>
                <button
                    onClick={() => {
                        setSelectedHostelForEdit(null);
                        setFormData({
                            name: '',
                            type: 'BOYS',
                        });
                        setIsHostelModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Hostel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostels?.map((hostel: any) => (
                    <div key={hostel.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Home size={24} />
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                ${hostel.type === 'BOYS' ? 'bg-blue-100 text-blue-800' :
                                    hostel.type === 'GIRLS' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'}`}>
                                {hostel.type}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{hostel.name}</h3>

                        <div className="flex gap-2 pt-4 border-t">
                            <button
                                onClick={() => { setSelectedHostelForEdit(hostel); setIsHostelModalOpen(true); }}
                                className="flex-1 p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 flex items-center justify-center">
                                <Edit2 size={18} /> <span className="ml-2 text-sm">Edit</span>
                            </button>
                            <button
                                onClick={() => { if (confirm('Delete hostel?')) deleteMutation.mutate(hostel.id); }}
                                className="flex-1 p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 flex items-center justify-center">
                                <Trash2 size={18} /> <span className="ml-2 text-sm">Delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title={selectedHostelForEdit ? "Edit Hostel" : "Add New Hostel"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hostel Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                            <option value="BOYS">Boys</option>
                            <option value="GIRLS">Girls</option>
                            <option value="COED">Co-Ed</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsHostelModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {createMutation.isPending ? 'Saving...' : (selectedHostelForEdit ? 'Update Hostel' : 'Create Hostel')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
