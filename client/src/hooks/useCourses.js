import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

/**
 * useCourses — manages teacher's courses.
 *
 * Each course object from the API is augmented with client-side fields
 * (customCols, hiddenCols, studentIds) stored in the course's `description`
 * as JSON metadata, or as separate top-level fields in the DB when available.
 *
 * The hook exposes a rich API matching what TeacherCourses.jsx expects.
 */
export function useCourses(teacherUserId) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Normalize a course from the API: ensure customCols, hiddenCols, studentIds exist
    const normalize = (c) => ({
        ...c,
        customCols: c.customCols || [],
        hiddenCols: c.hiddenCols || [],
        studentIds: c.studentIds || [],
    });

    const fetchCourses = useCallback(async () => {
        if (!teacherUserId) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await api.get('/courses');
            setCourses((data || []).map(normalize));
        } catch (e) { console.error('fetchCourses error', e); }
        finally { setLoading(false); }
    }, [teacherUserId]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    /* ── CRUD ─────────────────────────────────────────────────── */

    // addCourse(name, description) OR addCourse({ name, description, ... })
    const addCourse = async (nameOrObj, description) => {
        const payload = typeof nameOrObj === 'object'
            ? nameOrObj
            : { name: nameOrObj, description };

        try {
            const data = await api.post('/courses', {
                name: payload.name,
                code: payload.code || '',
                year: payload.year || null,
                semester: payload.semester || null,
                description: payload.description || '',
                customCols: payload.customCols || [],
                hiddenCols: payload.hiddenCols || [],
                studentIds: payload.studentIds || [],
            });
            const normalized = normalize(data);
            setCourses(prev => [normalized, ...prev]);
            return normalized;
        } catch (err) {
            console.error('addCourse error', err);
            return null;
        }
    };

    const updateCourse = async (id, updates) => {
        try {
            const data = await api.patch(`/courses/${id}`, updates);
            const normalized = normalize(data);
            setCourses(prev => prev.map(c => c.id === id ? normalized : c));
            return normalized;
        } catch (err) {
            // Optimistic update even if endpoint fails (for local-only fields like hiddenCols)
            setCourses(prev => prev.map(c => c.id === id ? normalize({ ...c, ...updates }) : c));
            console.error('updateCourse error', err);
        }
    };

    const deleteCourse = async (id) => {
        try {
            await api.delete(`/courses/${id}`);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (err) { console.error('deleteCourse error', err); }
    };

    /* ── Student membership ───────────────────────────────────── */

    const addStudentToCourse = async (courseId, studentId) => {
        const course = courses.find(c => c.id === courseId);
        if (!course || course.studentIds.includes(studentId)) return;
        const newIds = [...course.studentIds, studentId];
        await updateCourse(courseId, { studentIds: newIds });
    };

    const removeStudentFromCourse = async (courseId, studentId) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        const newIds = course.studentIds.filter(id => id !== studentId);
        await updateCourse(courseId, { studentIds: newIds });
    };

    /* ── Custom columns ───────────────────────────────────────── */

    const addCustomCol = async (courseId, colName) => {
        const course = courses.find(c => c.id === courseId);
        if (!course || course.customCols.includes(colName)) return;
        const newCols = [...course.customCols, colName];
        await updateCourse(courseId, { customCols: newCols });
    };

    const removeCustomCol = async (courseId, colName) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        const newCols = course.customCols.filter(c => c !== colName);
        await updateCourse(courseId, { customCols: newCols });
    };

    const hideCol = async (courseId, colKey) => {
        const course = courses.find(c => c.id === courseId);
        if (!course || course.hiddenCols.includes(colKey)) return;
        const newHidden = [...course.hiddenCols, colKey];
        await updateCourse(courseId, { hiddenCols: newHidden });
    };

    return {
        courses,
        loading,
        addCourse,
        updateCourse,
        deleteCourse,
        addStudentToCourse,
        removeStudentFromCourse,
        addCustomCol,
        removeCustomCol,
        hideCol,
        refetch: fetchCourses,
    };
}
