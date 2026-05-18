import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useStudents } from '../../hooks/useStudents.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { api } from '../../lib/api.js';
import {
    Search, Users, Plus, Download,
    Pencil, Trash2, CheckSquare, Square, MinusSquare, X
} from 'lucide-react';
import * as XLSX from 'xlsx';

const HERO_GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';

const YEARS = [
    { value: '', label: 'All Years' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
];

const SECTIONS = ['', 'A', 'B', 'C', 'D'];

export default function HODStudents() {

    const { departmentId } = useAuth();
    const { students } = useStudents(null, departmentId);
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [yearFilter, setYear] = useState('');
    const [sectionFilter, setSection] = useState('');

    const [selectedIds, setSelectedIds] = useState(new Set());

    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        studentId: '',
        fullName: '',
        email: '',
        year: '',
        semester: '',
        section: 'A'
    });

    /* ───────── FILTER ───────── */

    const filtered = useMemo(() => {

        return students.filter(s => {

            const q = search.toLowerCase();

            const matchSearch =
                !q ||
                s.name?.toLowerCase().includes(q) ||
                s.student_id?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q);

            const matchYear = !yearFilter || String(s.year) === yearFilter;
            const matchSection = !sectionFilter || s.section === sectionFilter;

            return matchSearch && matchYear && matchSection;

        });

    }, [students, search, yearFilter, sectionFilter]);

    /* ───────── Selection ───────── */

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {

        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(s => s.id)));
        }

    };

    const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length;

    /* ───────── EXPORT ───────── */

    const handleExport = () => {

        const rows = filtered.map(s => ({
            "Student ID": s.student_id || '',
            "Name": s.name || '',
            "Email": s.email || '',
            "Year": s.year || '',
            "Semester": s.semester || '',
            "Section": s.section || ''
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Students");

        XLSX.writeFile(wb, "students.xlsx");

    };

    const handleBulkExport = () => {

        const rows = filtered
            .filter(s => selectedIds.has(s.id))
            .map(s => ({
                "Student ID": s.student_id || '',
                "Name": s.name || '',
                "Email": s.email || '',
                "Year": s.year || '',
                "Semester": s.semester || '',
                "Section": s.section || ''
            }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Students");

        XLSX.writeFile(wb, "selected_students.xlsx");

    };

    /* ───────── DELETE ───────── */

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this student?")) return;

        try {

            await api.delete(`/students/${id}`);

            window.location.reload();

        } catch (err) {

            alert(err.message);

        }

    };

    const handleBulkDelete = async () => {

        const count = selectedIds.size;

        if (!window.confirm(`Delete ${count} students?`)) return;

        try {

            for (const id of selectedIds) {
                await api.delete(`/students/${id}`);
            }

            window.location.reload();

        } catch (err) {

            alert(err.message);

        }

    };

    /* ───────── ADD STUDENT ───────── */

    const handleSave = async () => {

        try {

            await api.post('/students', {
                studentId: form.studentId,
                fullName: form.fullName,
                email: form.email,
                year: Number(form.year),
                semester: Number(form.semester),
                section: form.section
            });

            setShowModal(false);

            window.location.reload();

        } catch (err) {

            alert(err.message);

        }

    };

    return (

        <DashboardLayout
            title="Students"
            subtitle={`${students.length} total students`}
        >

            {/* FILTER BAR */}

            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center mb-5">

                <div className="relative flex-1 min-w-[220px]">

                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, roll no, email..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />

                </div>

                <select
                    value={yearFilter}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                    {YEARS.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                </select>

                <select
                    value={sectionFilter}
                    onChange={(e) => setSection(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                    <option value="">All Sections</option>
                    {SECTIONS.filter(Boolean).map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                </select>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold" style={{ background: HERO_GRAD }}
                >
                    <Plus className="w-4 h-4" />
                    Add Student
                </button>

            </div>

            {/* TABLE */}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-gray-50 border-b">

                            <tr>

                                <th className="px-4 py-3">
                                    <button onClick={toggleSelectAll}>
                                        {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> :
                                            someSelected ? <MinusSquare className="w-4 h-4 text-indigo-400" /> :
                                                <Square className="w-4 h-4" />}
                                    </button>
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Year</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Section</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>

                            </tr>

                        </thead>

                        <tbody className="divide-y">

                            {filtered.map(s => (

                                <tr key={s.id} className="hover:bg-gray-50">

                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleSelect(s.id)}>
                                            {selectedIds.has(s.id)
                                                ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                : <Square className="w-4 h-4" />}
                                        </button>
                                    </td>

                                    <td className="px-5 py-3">{s.student_id}</td>
                                    <td className="px-5 py-3 font-medium">{s.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{s.email}</td>
                                    <td className="px-5 py-3">{s.year}</td>
                                    <td className="px-5 py-3">{s.section}</td>

                                    <td className="px-5 py-3 flex justify-end gap-2">

                                        <button
                                            onClick={() => navigate(`/hod/students/${s.id}`)}
                                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* BULK ACTION BAR */}

            {selectedIds.size > 0 && (

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-[#1a2b4b] text-white rounded-2xl shadow-2xl">

                    <span className="text-sm font-medium">{selectedIds.size} selected</span>

                    <button onClick={handleBulkExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>

                    <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-lg text-sm">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>

                    <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                        <X className="w-3.5 h-3.5" /> Clear
                    </button>

                </div>

            )}

            {/* ADD STUDENT MODAL */}

            {/* ADD STUDENT MODAL */}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Add Student
                            </h2>

                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                    Student ID
                                </label>
                                <input
                                    value={form.studentId}
                                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder="e.g. STU102"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                    Full Name
                                </label>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder="Student name"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                    Email
                                </label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder="student@email.com"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                        Year
                                    </label>
                                    <input
                                        value={form.year}
                                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                        Semester
                                    </label>
                                    <input
                                        value={form.semester}
                                        onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                        Section
                                    </label>
                                    <select
                                        value={form.section}
                                        onChange={(e) => setForm({ ...form, section: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>

                            </div>

                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">

                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Save Student
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </DashboardLayout>

    );

}