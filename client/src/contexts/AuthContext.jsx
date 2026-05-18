import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session
    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const normalizedEmail = email?.trim().toLowerCase();

            const data = await api.post('/auth/login', {
                email: normalizedEmail,
                password
            });

            // Ensure role is always lowercase for client-side routing
            const userData = { ...data.user, role: data.user.role?.toLowerCase() };

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);

            return { success: true, role: userData.role };

        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const signUp = async (email, password, fullName, role, departmentId) => {
        try {
            const normalizedEmail = email?.trim().toLowerCase();

            const data = await api.post('/auth/register', {
                email: normalizedEmail,
                password,
                fullName,
                role,
                departmentId: departmentId || null
            });

            // Ensure role is always lowercase for client-side routing
            const userData = { ...data.user, role: data.user.role?.toLowerCase() };

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);

            return { success: true, role: userData.role };

        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (updates) => {
        const updated = { ...user, ...updates };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            signUp,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}