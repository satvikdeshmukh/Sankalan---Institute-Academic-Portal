import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

export function useProfile(userId) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await api.get(`/profiles/${userId}`);
            setProfile(data);
        } finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { fetch(); }, [fetch]);

    const updateProfile = async (updates) => {
        const data = await api.patch('/profiles/me', updates);
        setProfile(data);
        return data;
    };

    return { profile, loading, updateProfile, refetch: fetch };
}
