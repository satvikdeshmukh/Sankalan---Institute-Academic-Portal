
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { Search, Filter, Target, Users, Loader2, X, ChevronRight, FileText, GraduationCap, BookOpen } from 'lucide-react';

const HERO_GRAD = 'linear-gradient(135deg, rgb(120,53,15) 0%, rgb(180,83,9) 40%, rgb(217,119,6) 75%, rgb(251,191,36) 100%)';
const YEARS = [
    { value: '', label: 'All Years' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' },
];

const SEMESTERS = [
    { value: '', label: 'All Semesters' },
    { value: '1', label: 'Sem 1' }, { value: '2', label: 'Sem 2' },
    { value: '3', label: 'Sem 3' }, { value: '4', label: 'Sem 4' },
    { value: '5', label: 'Sem 5' }, { value: '6', label: 'Sem 6' },
    { value: '7', label: 'Sem 7' }, { value: '8', label: 'Sem 8' },
];

export default function HODMarks() {
    const { departmentId } = useAuth();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [offerings, setOfferings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [yearFilter, setYear] = useState('');
    const [semFilter, setSem] = useState('');
    const [selectedExamType, setSelectedExamType] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        setLoading(true);
        const url = departmentId ? `/students?departmentId=${departmentId}` : '/students';
        Promise.all([
            api.get(url).catch(() => []),
            api.get('/subjects/offerings').catch(() => [])
        ]).then(([studentsData, offeringsData]) => {
            setStudents(Array.isArray(studentsData) ? studentsData : []);
            setOfferings(Array.isArray(offeringsData) ? offeringsData : []);
        }).finally(() => setLoading(false));
    }, [departmentId]);

    const examTypeCards = useMemo(() => {
        const deptOfferings = offerings.filter(o => {
            if (!departmentId) return true;
            return o.subject?.departmentId === departmentId;
        });
        
        const examCounts = {};
        deptOfferings.forEach(off => {
            if (off.marks) {
                off.marks.forEach(m => {
                    if (!examCounts[m.examType]) {
                        examCounts[m.examType] = { type: m.examType, count: 0, totalMarks: 0, subjects: new Set() };
                    }
                    examCounts[m.examType].count++;
                    examCounts[m.examType].totalMarks += m.marks || 0;
                    examCounts[m.examType].subjects.add(off.id);
                });
            }
        });
        
        return Object.values(examCounts).map(e => ({
            ...e,
            subjectCount: e.subjects.size,
            avgMarks: e.count > 0 ? Math.round(e.totalMarks / e.count) : 0
        }));
    }, [offerings, departmentId]);

    const subjectCards = useMemo(() => {
        if (!selectedExamType) return [];
        
        return offerings.filter(o => {
            if (departmentId && o.subject?.departmentId !== departmentId) return false;
            return (o.marks || []).some(m => m.examType === selectedExamType);
        }).map(o => {
            const relevantMarks = o.marks.filter(m => m.examType === selectedExamType);
            const total = relevantMarks.reduce((sum, m) => sum + (m.marks || 0), 0);
            return {
                ...o,
                studentCount: relevantMarks.length,
                avgMarks: relevantMarks.length > 0 ? Math.round(total / relevantMarks.length) : 0
            };
        });
    }, [selectedExamType, offerings, departmentId]);

    const studentListData = useMemo(() => {
        if (!selectedSubject) return [];
        
        const q = search.toLowerCase();
        return (selectedSubject.marks || [])
            .filter(m => m.examType === selectedExamType)
            .map(m => {
                const student = students.find(s => s.id === m.studentId);
                return {
                    ...m,
                    fullName: student?.fullName || 'Unknown Student',
                    studentId: student?.studentId,
                    enrollment: student?.enrollments?.[0]
                };
            })
            .filter(item => {
                const matchSearch = !q 
                    || (item.fullName || '').toLowerCase().includes(q)
                    || (item.studentId || '').toLowerCase().includes(q);
                
                const sYear = item.enrollment?.year;
                const sSem = item.enrollment?.semester;
                const matchYear = !yearFilter || String(sYear) === yearFilter;
                const matchSem = !semFilter || String(sSem) === semFilter;
                
                return matchSearch && matchYear && matchSem;
            });
    }, [selectedSubject, selectedExamType, students, search, yearFilter, semFilter]);

    const getMarkColor = (avg) => {
        if (avg == null) return 'text-gray-400';
        if (avg >= 80) return 'text-emerald-600';
        if (avg >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getMarkBg = (avg) => {
        if (avg == null) return 'bg-gray-50';
        if (avg >= 80) return 'bg-emerald-50';
        if (avg >= 50) return 'bg-amber-50';
        return 'bg-red-50';
    };

    const handleExamTypeClick = (examType) => {
        setSelectedExamType(examType);
        setSelectedSubject(null);
    };

    const handleSubjectClick = (offering) => {
        setSelectedSubject(offering);
    };

    const clearFilters = () => {
        setSearch('');
        setYear('');
        setSem('');
    };

    return (
        <DashboardLayout title="Department Marks" subtitle="Subject-wise performance tracking">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-2">
                <button 
                    onClick={() => { setSelectedExamType(null); setSelectedSubject(null); }}
                    className={`hover:text-black font-medium transition-colors ${!selectedExamType ? 'text-amber-700' : ''}`}
                >
                    All Exam Types
                </button>
                {selectedExamType && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <button 
                            onClick={() => setSelectedSubject(null)}
                            className={`hover:text-black font-medium transition-colors ${selectedExamType && !selectedSubject ? 'text-amber-700' : ''}`}
                        >
                            {selectedExamType} Subjects
                        </button>
                    </>
                )}
                {selectedSubject && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-amber-700 font-bold">{selectedSubject.subject?.name} (Sec {selectedSubject.section})</span>
                    </>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <>
                    {!selectedExamType && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {examTypeCards.map(exam => (
                                <button
                                    key={exam.type}
                                    onClick={() => handleExamTypeClick(exam.type)}
                                    className="bg-white rounded-2xl border border-gray-200 p-5 text-left hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity bg">
                                        <Target className="w-16 h-16" />
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-white mb-4  transition-colors" style={{ background: HERO_GRAD }}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-black text-gray-900 text-lg mb-1">{exam.type}</h3>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{exam.subjectCount} Subjects</p>
                                        <div className="flex items-center justify-between mt-4 bg-gray-50 rounded-lg px-3 py-2">
                                            <span className="text-xs text-gray-400">{exam.count} Students</span>
                                            <span className={`text-sm font-black ${getMarkColor(exam.avgMarks)}`}>{exam.avgMarks}% Avg</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedExamType && !selectedSubject && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-xl font-black text-gray-900">Select Subject</h3>
                                <div className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-bold">
                                    {selectedExamType}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subjectCards.map(off => (
                                    <button
                                        key={off.id}
                                        onClick={() => handleSubjectClick(off)}
                                        className="bg-white rounded-2xl border border-gray-200 p-5 text-left hover:shadow-xl hover:border-indigo-300 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-tighter">
                                                Sec {off.section}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{off.subject?.name}</h4>
                                        <p className="text-xs text-gray-400 mb-4">Code: {off.subject?.code}</p>
                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Users className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{off.studentCount} Students</span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-lg text-xs font-black ${getMarkBg(off.avgMarks)} ${getMarkColor(off.avgMarks)}`}>
                                                {off.avgMarks}% Avg
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedExamType && selectedSubject && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name or roll..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <select value={yearFilter} onChange={e => setYear(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                                </select>
                                <select value={semFilter} onChange={e => setSem(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                {(search || yearFilter || semFilter) && (
                                    <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Student ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Student Name</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Marks</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {studentListData.map((row, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{row.studentId || '—'}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{row.fullName}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-lg font-black ${getMarkColor(row.marks)}`}>
                                                        {row.marks}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${row.marks >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {row.marks >= 40 ? 'Pass' : 'Fail'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
