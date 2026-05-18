import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Blocked() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-6 animate-fade-in">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
                <p className="text-gray-500 mb-8">Your account has been suspended by the administrator. Please contact your institution's admin for assistance.</p>
                <Link to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
