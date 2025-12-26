import { create } from 'zustand';
import api from '../services/api';

interface AuthState {
    token: string | null;
    role: string | null;
    userId: string | null;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('adminToken'),
    role: localStorage.getItem('adminRole'),
    userId: localStorage.getItem('adminUserId'),
    isAuthenticated: !!localStorage.getItem('adminToken'),

    login: async (phone, password) => {
        try {
            const response = await api.post('/auth/admin-login/', { phone, password });
            const { access, role, user_id } = response.data;
            localStorage.setItem('adminToken', access);
            localStorage.setItem('adminRole', role);
            localStorage.setItem('adminUserId', user_id);
            set({ token: access, role, userId: user_id, isAuthenticated: true });
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUserId');
        set({ token: null, role: null, userId: null, isAuthenticated: false });
    },
}));
