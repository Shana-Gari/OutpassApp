import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Classes() {
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    const [newClassName, setNewClassName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');

    const queryClient = useQueryClient();

    // Fetch Classes
    const { data: classes, isLoading: classesLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => (await api.get('/classes/')).data
    });

    // Fetch Sections
    const { data: sections, isLoading: sectionsLoading } = useQuery({
        queryKey: ['sections'],
        queryFn: async () => (await api.get('/sections/')).data
    });

    const [selectedClassForEdit, setSelectedClassForEdit] = useState<any>(null);
    const [selectedSectionForEdit, setSelectedSectionForEdit] = useState<any>(null);

    // ... Arrays ...

    // Mutations for Class
    const createClassMutation = useMutation({
        mutationFn: (data: any) => {
            if (selectedClassForEdit) {
                return api.patch(`/classes/${selectedClassForEdit.id}/`, data);
            }
            return api.post('/classes/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setIsClassModalOpen(false);
            setNewClassName('');
            setSelectedClassForEdit(null);
        },
        onError: (err) => alert('Failed: ' + JSON.stringify(err))
    });

    const deleteClassMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/classes/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
        onError: (err: any) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
    });

    // Mutations for Section
    const createSectionMutation = useMutation({
        mutationFn: (data: any) => {
            if (selectedSectionForEdit) {
                return api.patch(`/sections/${selectedSectionForEdit.id}/`, data);
            }
            return api.post('/sections/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            setIsSectionModalOpen(false);
            setNewSectionName('');
            setSelectedSectionForEdit(null);
        },
        onError: (err) => alert('Failed: ' + JSON.stringify(err))
    });

    const deleteSectionMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/sections/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
        onError: (err: any) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
    });


    const handleCreateClass = (e: FormEvent) => {
        e.preventDefault();
        createClassMutation.mutate({ name: newClassName });
    };

    const handleCreateSection = (e: FormEvent) => {
        e.preventDefault();
        // If editing, we just need name. If creating, we need class_obj.
        const payload: any = { name: newSectionName };
        if (!selectedSectionForEdit && selectedClassId) {
            payload.class_obj = selectedClassId;
        }
        createSectionMutation.mutate(payload);
    };

    const openEditClass = (cls: any) => {
        setNewClassName(cls.name);
        setSelectedClassForEdit(cls);
        setIsClassModalOpen(true);
    };

    const openEditSection = (sec: any) => {
        setNewSectionName(sec.name);
        setSelectedSectionForEdit(sec);
        setIsSectionModalOpen(true);
    };

    if (classesLoading || sectionsLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Classes & Sections</h1>
                <button
                    onClick={() => { setSelectedClassForEdit(null); setNewClassName(''); setIsClassModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Class
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes?.map((cls: any) => (
                    <div key={cls.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3
                                className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                                onClick={() => openEditClass(cls)}
                                title="Click to Edit Class Name"
                            >
                                {cls.name} <Edit2 size={14} className="inline ml-1 text-gray-400" />
                            </h3>
                            <button
                                onClick={() => { if (confirm('Delete class and all its sections?')) deleteClassMutation.mutate(cls.id); }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            {sections?.filter((s: any) => s.class_obj === cls.id).map((sec: any) => (
                                <div key={sec.id} className="flex justify-between items-center bg-gray-50 p-2 rounded group">
                                    <span className="text-gray-700">Section {sec.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditSection(sec)} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                                        <button onClick={() => { if (confirm('Delete section?')) deleteSectionMutation.mutate(sec.id); }} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            {sections?.filter((s: any) => s.class_obj === cls.id).length === 0 && (
                                <p className="text-gray-400 text-sm italic">No sections created</p>
                            )}
                        </div>

                        <button
                            onClick={() => { setSelectedClassId(cls.id); setSelectedSectionForEdit(null); setNewSectionName(''); setIsSectionModalOpen(true); }}
                            className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 flex justify-center items-center gap-2"
                        >
                            <Plus size={16} /> Add Section
                        </button>
                    </div>
                ))}
            </div>

            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title={selectedClassForEdit ? "Edit Class" : "Add New Class"}>
                <form onSubmit={handleCreateClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Class Name (e.g. "10", "XII")</label>
                        <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createClassMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                            {createClassMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title={selectedSectionForEdit ? "Edit Section" : "Add New Section"}>
                <form onSubmit={handleCreateSection} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Section Name (e.g. "A", "Diamond")</label>
                        <input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createSectionMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                            {createSectionMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
