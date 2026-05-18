import { useState, useEffect, useCallback } from 'react';
import { api, getToken } from '../lib/api.js';
import socket from '../lib/socket.js';

const SERVER = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useDocuments(userId) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocs = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const data = await api.get('/documents');
            setDocuments(Array.isArray(data) ? data : []);
        } catch (e) { console.error('fetchDocs error', e); }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => {
        fetchDocs();
        // Real-time: refresh list on any document change event
        socket.on('document_change', fetchDocs);
        return () => socket.off('document_change', fetchDocs);
    }, [fetchDocs]);

    /**
     * Upload a document file.
     * @param {File} file - The file to upload.
     * @param {string} [name] - Optional display name. Defaults to file.name.
     * @param {string} [category='personal'] - 'personal' | 'academic'
     */
    const uploadDocument = async (file, name, category = 'personal') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || file.name);
        formData.append('category', category);

        const res = await window.fetch(`${SERVER}/api/documents/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
        }

        const data = await res.json();
        setDocuments(prev => [data, ...prev]);
        return data;
    };

    const deleteDocument = async (id) => {
        await api.delete(`/documents/${id}`);
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    return { documents, loading, uploadDocument, deleteDocument, refetch: fetchDocs };
}
