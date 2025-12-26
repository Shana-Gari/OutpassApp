import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Link as LinkIcon, Trash2, Info, Download } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';


export default function Parents() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedParentForEdit, setSelectedParentForEdit] = useState<any>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: parents, isLoading } = useQuery({
        queryKey: ['parents', debouncedSearch],
        queryFn: async () => (await api.get('/users/?search=' + debouncedSearch)).data?.filter((u: any) => u.role === 'PARENT')
    });

    const deleteParentMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parents'] });
        },
        onError: (err: any) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
    });

    const handleExport = async () => {
        try {
            const response = await api.get('/export/?type=parents', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'parents.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Parents</h1>
                    <p className="text-gray-500 text-sm">Manage parent accounts and link them to students.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button onClick={() => { setSelectedParentForEdit(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <Plus size={20} /> Add Parent
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search parents by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Password (Default) <span title="Showing default password. If user changed it, this value is invalid." className="cursor-help"><Info size={14} className="inline" /></span>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                        ) : parents?.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No parents found.</td></tr>
                        ) : (
                            parents?.map((parent: any) => (
                                <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{parent.first_name} {parent.last_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parent.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all">
                                                {parent.phone}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                (Initial)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setSelectedParentId(parent.id); setIsLinkModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1 inline-flex"
                                        >
                                            <LinkIcon size={16} /> Link
                                        </button>
                                        <button
                                            onClick={() => { setSelectedParentForEdit(parent); setIsModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center gap-1 inline-flex"
                                        >
                                            <Edit2 size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Are you sure you want to delete this parent?')) deleteParentMutation.mutate(parent.id); }}
                                            className="text-red-600 hover:text-red-900 flex items-center gap-1 inline-flex"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedParentForEdit ? "Edit Parent" : "Add New Parent"}>
                <ParentForm
                    initialData={selectedParentForEdit}
                    onSuccess={() => { setIsModalOpen(false); setSelectedParentForEdit(null); }}
                />
            </Modal>

            <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Link Student to Parent">
                <LinkStudentFlow
                    parentId={selectedParentId}
                    onSuccess={() => { setIsLinkModalOpen(false); }}
                />
            </Modal>
        </div>
    );
}

function ParentForm({ initialData, onSuccess }: { initialData?: any, onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        role: 'PARENT'
    });

    // Only show student linking for new parents for simplicity, or keep logic but hide UI if editing? 
    // Usually editing parent just updates details. Linking is handled separately via "Link" button.
    // So for Edit mode, we can hide the student selection to reduce complexity unless requested.
    // Let's hide student selection in Edit mode for now.

    const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

    // Student Selection State
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [currentStudentId, setCurrentStudentId] = useState('');

    const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: async () => (await api.get('/classes/')).data });
    const { data: sections } = useQuery({ queryKey: ['sections', selectedClass], queryFn: async () => (await api.get(`/sections/?class_obj=${selectedClass}`)).data, enabled: !!selectedClass });
    const { data: students } = useQuery({ queryKey: ['students', selectedSection], queryFn: async () => (await api.get(`/students/?section=${selectedSection}`)).data, enabled: !!selectedSection });

    const mutation = useMutation({
        mutationFn: (data: any) => initialData ? api.patch(`/users/${initialData.id}/`, data) : api.post('/users/', data),
        onSuccess: async (data) => {
            if (!initialData) {
                const parentId = data.data.id;
                for (const student of selectedStudents) {
                    await api.post('/link-student/', {
                        parent_id: parentId,
                        admission_number: student.admission_number
                    });
                }
            }
            queryClient.invalidateQueries({ queryKey: ['parents'] });
            onSuccess();
            alert(initialData ? 'Parent updated!' : 'Parent created!');
        },
        onError: (err: any) => alert('Failed: ' + (err.response?.data?.error || err.message))
    });

    const handleAddStudent = () => {
        const student = students?.find((s: any) => s.id === currentStudentId);
        if (student && !selectedStudents.find(s => s.id === student.id)) {
            setSelectedStudents([...selectedStudents, student]);
            setCurrentStudentId('');
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <strong>Note:</strong> Initial password is the user's <strong>Phone Number</strong>. Users can change it later.
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required placeholder="e.g. 9876543210" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder={initialData ? "Leave empty to keep current" : "Optional"} />
                </div>
            </div>

            {!initialData && (
                <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Link Students (Optional)</h3>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded text-sm">
                            <option value="">Class</option>
                            {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="border p-2 rounded text-sm" disabled={!selectedClass}>
                            <option value="">Section</option>
                            {sections?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={currentStudentId} onChange={e => setCurrentStudentId(e.target.value)} className="border p-2 rounded text-sm" disabled={!selectedSection}>
                            <option value="">Student</option>
                            {students?.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={handleAddStudent} disabled={!currentStudentId} className="w-full py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm mb-2">
                        + Add to List
                    </button>

                    {selectedStudents.length > 0 && (
                        <div className="space-y-1">
                            {selectedStudents.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-sm">
                                    <span>{s.first_name} {s.last_name}</span>
                                    <button type="button" onClick={() => setSelectedStudents(prev => prev.filter(st => st.id !== s.id))} className="text-red-500">x</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onSuccess} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    {mutation.isPending ? 'Saving...' : (initialData ? 'Update Parent' : 'Create Parent')}
                </button>
            </div>
        </form>
    );
}



function LinkStudentFlow({ parentId, onSuccess }: { parentId: string | null, onSuccess: () => void }) {
    // ... kept for existing "Link Student" button functionality on the table row
    // (Wait, do we keep the row button? Yes, useful for adding later).
    // Let's copy the logic back or keep it simple.
    // Ideally user wants "when parent is being added".
    // I can reuse the logic code or just keep this simple component here or below.
    // For brevity of this tool call, I will include a simplified version or the previous one.
    // Let's bring back the previous LinkStudentFlow because likely I replaced the whole file bottom.

    // RE-INSERTING PREVIOUS LINK STUDENT FLOW LOGIC FOR ROW ACTION
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    // Fetch Classes
    const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: async () => (await api.get('/classes/')).data });
    const { data: sections } = useQuery({ queryKey: ['sections', selectedClass], queryFn: async () => (await api.get(`/sections/?class_obj=${selectedClass}`)).data, enabled: !!selectedClass });
    const { data: students } = useQuery({ queryKey: ['students', selectedSection], queryFn: async () => (await api.get(`/students/?section=${selectedSection}`)).data, enabled: !!selectedSection });

    const linkMutation = useMutation({
        mutationFn: async () => {
            const student = students?.find((s: any) => s.id === selectedStudent);
            if (!student) throw new Error("Student not found");
            return api.post('/link-student/', { parent_id: parentId, admission_number: student.admission_number });
        },
        onSuccess: () => { alert('Student linked successfully!'); onSuccess(); },
        onError: (err: any) => alert(err.response?.data?.error || 'Failed to link')
    });

    return (
        <div className="space-y-4">
            {/* ... UI for single link ... */}
            <div className="grid grid-cols-1 gap-4">
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded"><option value="">Class</option>{classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="border p-2 rounded" disabled={!selectedClass}><option value="">Section</option>{sections?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="border p-2 rounded" disabled={!selectedSection}><option value="">Student</option>{students?.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>)}</select>
            </div>
            <button onClick={() => linkMutation.mutate()} disabled={!selectedStudent || linkMutation.isPending} className="w-full px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">Link Student</button>
        </div>
    );
}
