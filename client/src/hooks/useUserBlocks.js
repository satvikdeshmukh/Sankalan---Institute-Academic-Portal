import { useState } from 'react';
import { api } from '../lib/api.js';

export function useUserBlocks() {
    const [loading, setLoading] = useState(false);

    const blockUser = async (userId, adminId, reason) => {
        setLoading(true);
        try {
            await api.post('/admin/block-user', { userId, reason });
            setLoading(false);
            return true;
        } catch (e) { setLoading(false); console.error('block error', e); return false; }
    };

    const unblockUser = async (userId) => {
        setLoading(true);
        try {
            await api.post('/admin/unblock-user', { userId });
            setLoading(false);
            return true;
        } catch (e) { setLoading(false); console.error('unblock error', e); return false; }
    };

    const deleteUser = async (userId) => {
        setLoading(true);
        try {
            await api.delete(`/admin/users/${userId}`);
            setLoading(false);
            return true;
        } catch (e) { setLoading(false); console.error('delete error', e); return false; }
    };

    return { loading, blockUser, unblockUser, deleteUser };
}
