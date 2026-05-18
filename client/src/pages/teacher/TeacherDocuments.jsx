import React, { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useDocuments } from '../../hooks/useDocuments.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Upload, Download, Trash2, FolderOpen, FileText } from 'lucide-react';

function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TeacherDocuments() {
    const { user } = useAuth();
    const { documents, loading, uploadDocument, deleteDocument } = useDocuments(user?.id);
    const fileRef = useRef();

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        await uploadDocument(file, '');
        e.target.value = '';
    };

    const handleDownload = async (doc) => {
        try {
            const res = await api.get(`/documents/${doc.id}/url`);
            const url = res?.url || doc.url;
            if (url) window.open(url, '_blank');
        } catch {
            if (doc.url) window.open(doc.url, '_blank');
        }
    };

    return (
        <DashboardLayout title="Documents" subtitle="Upload and manage department documents">
            <div className="flex justify-end mb-6">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Upload className="w-4 h-4" /> Upload Document
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>
                : documents.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-card p-20 text-center text-gray-400">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No documents yet. Upload your first document.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>{['File Name', 'Type', 'Size', 'Uploaded', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {documents.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                <span className="font-medium text-gray-900 truncate max-w-xs">{doc.file_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">{doc.file_type?.split('/')[1]?.toUpperCase() || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400">{formatSize(doc.file_size)}</td>
                                        <td className="px-4 py-3 text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDownload(doc)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4" /></button>
                                                <button onClick={() => deleteDocument(doc)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
        </DashboardLayout>
    );
}