/**
 * Supabase compatibility shim
 * Replaces @supabase/supabase-js with a local API proxy so existing components
 * don't need to be rewritten. All .from().select/insert/update/delete calls
 * are forwarded to the local Express server.
 */
import { getToken } from './api.js';

const BASE = 'http://localhost:3001/api';

async function req(path, method = 'GET', body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: data };
    return { data, error: null };
}

// Table → API endpoint mapping
const TABLE_MAP = {
    profiles: '/admin/users',
    user_roles: '/admin/users',
    user_blocks: '/admin/users',
    student_records: '/students',
    timetable: '/timetable',
    reports: '/reports',
    documents: '/documents',
    departments: '/auth/departments',
    teacher_assignments: '/admin/departments',
    courses: '/courses',
};

function tableEndpoint(table) {
    return TABLE_MAP[table] || `/${table}`;
}

/**
 * Fluent query builder — mimics supabase.from(table).select(...).eq(...) etc.
 */
function buildQuery(table) {
    let _method = 'GET';
    let _body = undefined;
    let _filters = {};
    let _single = false;
    let _count = false;
    let _head = false;
    let _selectId = undefined;

    const chain = {
        select(cols, opts) {
            if (opts?.count) { _count = true; _head = opts?.head; }
            return chain;
        },
        eq(col, val) {
            _filters[col] = val;
            if (col === 'id') _selectId = val;
            return chain;
        },
        neq(col, val) { return chain; },
        in(col, vals) { return chain; },
        ilike(col, val) { return chain; },
        order(col, opts) { return chain; },
        limit(n) { return chain; },
        range(from, to) { return chain; },
        single() { _single = true; return chain; },
        maybeSingle() { _single = true; return chain; },

        insert(data) {
            _method = 'POST';
            _body = data;
            return chain;
        },
        upsert(data, opts) {
            _method = 'POST';
            _body = data;
            return chain;
        },
        update(data) {
            _method = 'PATCH';
            _body = data;
            return chain;
        },
        delete() {
            _method = 'DELETE';
            return chain;
        },

        // Execute
        then(resolve, reject) {
            return execute().then(resolve, reject);
        },
    };

    async function execute() {
        const base = tableEndpoint(table);

        // Build query string
        const params = new URLSearchParams();
        Object.entries(_filters).forEach(([k, v]) => {
            if (k === 'teacher_user_id') params.append('teacherUserId', v);
            else if (k === 'department_id') params.append('departmentId', v);
            else if (k === 'user_id') params.append('userId', v);
            else params.append(k, v);
        });
        const qs = params.toString() ? `?${params}` : '';

        let path = base;
        if (_selectId && (_method === 'GET' || _method === 'PATCH' || _method === 'DELETE')) {
            path = `${base}/${_selectId}`;
        }

        const result = await req(`${path}${_selectId ? '' : qs}`, _method, _body);

        if (_count) return { count: Array.isArray(result.data) ? result.data.length : 0, error: result.error };

        let data = result.data;
        if (_single && Array.isArray(data)) data = data[0] || null;

        return { data, error: result.error };
    }

    return chain;
}

// Auth shim — minimal stub (auth is handled by AuthContext now)
const authShim = {
    getUser: async () => {
        const token = getToken();
        if (!token) return { data: { user: null }, error: null };
        return { data: { user: { id: 'local' } }, error: null };
    },
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { error: null };
    },
    onAuthStateChange: (cb) => {
        return { data: { subscription: { unsubscribe: () => { } } } };
    },
};

// Channel shim — socket.io handles realtime now
function channelShim(name) {
    const handlers = [];
    return {
        on: () => channelShim(name),
        subscribe: () => channelShim(name),
    };
}

export const supabase = {
    from: (table) => buildQuery(table),
    auth: authShim,
    channel: (name) => channelShim(name),
    removeChannel: () => { },
    storage: {
        from: () => ({
            upload: async () => ({ data: null, error: { message: 'Use /api/documents/upload instead' } }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
    },
};

export default supabase;
