// Central API helper — replaces @supabase/supabase-js on the client
const BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';

export function getToken() {
    return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
}

// Convenience helpers
export const api = {
    get: (path) => apiFetch(path),
    post: (path, body) => apiFetch(path, { method: 'POST', body }),
    put: (path, body) => apiFetch(path, { method: 'PUT', body }),
    patch: (path, body) => apiFetch(path, { method: 'PATCH', body }),
    delete: (path, body) => apiFetch(path, { method: 'DELETE', ...(body ? { body } : {}) }),

    // FormData upload — no JSON.stringify, no Content-Type (browser sets multipart boundary)
    upload: async (path, formData) => {
        const res = await fetch(`${BASE}${path}`, {
            method: 'POST',
            headers: {
                ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
        }
        return res.json();
    },
};
