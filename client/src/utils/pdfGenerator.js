import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a Class Report PDF — professional format matching the reference design
 */
export function generateAnnualReportPDF(opts = {}) {
    const {
        title = 'Annual Report',
        content = '',
        generatedBy = '',
        date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        charts = {},                // { attendance: [{month, attendance}] }
        students = [],              // [{name, student_id, email, contact, attendance, year}]
        summary = {},               // { totalStudents, avgAttendance, highPerformers, lowAttendance }
        subjectCompData = [],       // [{subject, average}]
        performanceData = [],       // [{month, value}]
        visibleCharts = { attendance: true, performance: true, subjectComparison: false },
    } = opts;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const NAVY = [26, 43, 75];
    const ORANGE = [234, 130, 10];
    const LIGHT = [240, 245, 255];

    /* ── helpers ── */
    const sectionHeader = (label, yPos) => {
        doc.setFillColor(...NAVY);
        doc.rect(14, yPos - 4, 4, 10, 'F');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(label, 22, yPos + 3);
        return yPos + 14;
    };

    const drawBarChart = (data, keyX, keyY, x, yPos, w, h, fillColor, maxVal) => {
        if (!data.length) return;
        const bw = Math.min((w - (data.length - 1) * 3) / data.length, 22);
        const gap = (w - bw * data.length) / Math.max(data.length - 1, 1);
        const max = maxVal || Math.max(...data.map(d => Number(d[keyY]) || 0), 1);

        // grid
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.15);
        [0, 0.25, 0.5, 0.75, 1].forEach(f => {
            const ly = yPos + h - f * h;
            doc.line(x, ly, x + w, ly);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(String(Math.round(f * max)), x - 2, ly + 1, { align: 'right' });
        });

        data.forEach((d, i) => {
            const val = Number(d[keyY]) || 0;
            const bh = (val / max) * h;
            const bx = x + i * (bw + gap);
            const by = yPos + h - bh;
            doc.setFillColor(...fillColor);
            doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
            // value label
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            if (bh > 4) doc.text(String(val), bx + bw / 2, by - 1.5, { align: 'center' });
            // x-axis label
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text(String(d[keyX] || '').slice(0, 6), bx + bw / 2, yPos + h + 5, { align: 'center' });
        });
    };

    const drawLineChart = (data, keyX, keyY, x, yPos, w, h, strokeColor) => {
        if (data.length < 2) return;
        const max = Math.max(...data.map(d => Number(d[keyY]) || 0), 1);
        const pts = data.map((d, i) => ({
            px: x + (i / (data.length - 1)) * w,
            py: yPos + h - (Number(d[keyY]) / max) * h,
            val: Number(d[keyY]),
            label: String(d[keyX] || ''),
        }));
        // grid
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.15);
        [0, 0.25, 0.5, 0.75, 1].forEach(f => {
            const ly = yPos + h - f * h;
            doc.line(x, ly, x + w, ly);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(String(Math.round(f * max)), x - 2, ly + 1, { align: 'right' });
        });
        // line
        doc.setDrawColor(...strokeColor);
        doc.setLineWidth(0.7);
        for (let i = 0; i < pts.length - 1; i++) {
            doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
        }
        // dots
        pts.forEach(p => {
            doc.setFillColor(...strokeColor);
            doc.circle(p.px, p.py, 1.3, 'F');
            doc.setFillColor(255, 255, 255);
            doc.circle(p.px, p.py, 0.6, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...strokeColor);
            doc.text(String(p.val), p.px, p.py - 2.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text(p.label.slice(0, 4), p.px, yPos + h + 5, { align: 'center' });
        });
    };

    /* ════════ PAGE 1 ════════ */
    // Header
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title || 'Annual Report', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by: ${generatedBy || 'Teacher'}  |  ${date}`, 14, 29);
    // Orange accent
    doc.setFillColor(...ORANGE);
    doc.rect(0, 36, W, 2.5, 'F');

    let y = 50;

    // ── Executive Summary ──
    y = sectionHeader('Executive Summary', y);

    const avgAtt = summary.avgAttendance || 0;
    const highPerf = summary.highPerformers ?? students.filter(s => Number(s.attendance) >= 75).length;
    const lowAtt = summary.lowAttendance ?? students.filter(s => Number(s.attendance) < 50).length;

    const cards = [
        { label: 'Total Students', value: summary.totalStudents ?? students.length, border: [30, 64, 175], bg: [219, 234, 254] },
        { label: 'Avg Attendance', value: `${avgAtt.toFixed ? avgAtt.toFixed(1) : avgAtt}%`, border: [22, 163, 74], bg: [220, 252, 231] },
        { label: 'High Performers', value: highPerf, border: [124, 58, 237], bg: [233, 213, 255] },
        { label: 'Low Attendance', value: lowAtt, border: [239, 68, 68], bg: [254, 226, 226] },
    ];
    const cardW = 42;
    cards.forEach((c, i) => {
        const cx = 14 + i * (cardW + 3);
        doc.setFillColor(...c.bg);
        doc.roundedRect(cx, y, cardW, 22, 2, 2, 'F');
        doc.setFillColor(...c.border);
        doc.rect(cx, y, 3, 22, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 130, 150);
        doc.text(c.label, cx + 7, y + 7);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.border);
        doc.text(String(c.value), cx + 7, y + 17);
    });
    y += 30;

    // ── Data Visualizations section ──
    const hasAttChart = visibleCharts.attendance && charts.attendance && charts.attendance.length > 0;
    const hasSubjChart = visibleCharts.subjectComparison && subjectCompData.length > 0;
    const hasPerfChart = visibleCharts.performance && performanceData.length >= 2;

    if (hasAttChart || hasSubjChart || hasPerfChart) {
        y = sectionHeader('Data Visualizations', y);

        // Attendance Analysis
        if (hasAttChart) {
            doc.setFillColor(...LIGHT);
            doc.roundedRect(14, y, 182, 60, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...NAVY);
            doc.text('Attendance Analysis (Monthly Average)', 105, y + 9, { align: 'center' });
            drawBarChart(charts.attendance, 'month', 'attendance', 26, y + 14, 158, 36, [30, 64, 175], 100);
            y += 67;
        }

        // Subject Comparison
        if (hasSubjChart) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFillColor(...LIGHT);
            doc.roundedRect(14, y, 182, 60, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...NAVY);
            doc.text('Subject Comparison', 105, y + 9, { align: 'center' });
            drawBarChart(subjectCompData, 'subject', 'average', 26, y + 14, 158, 36, [124, 58, 237]);
            y += 67;
        }

        // Performance Trend
        if (hasPerfChart) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFillColor(...LIGHT);
            doc.roundedRect(14, y, 182, 60, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...NAVY);
            doc.text('Performance Trend', 105, y + 9, { align: 'center' });
            drawLineChart(performanceData, 'month', 'value', 26, y + 14, 158, 36, [8, 145, 178]);
            y += 67;
        }
    }

    // ── Notes (if any) ──
    if (content) {
        if (y > 240) { doc.addPage(); y = 20; }
        y = sectionHeader('Notes', y);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 70);
        const lines = doc.splitTextToSize(content, 178);
        doc.text(lines, 16, y);
        y += lines.length * 4.5 + 6;
    }

    // ── Student Records table ──
    if (students.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y = sectionHeader('Student Records', y);

        autoTable(doc, {
            startY: y,
            head: [['Student ID', 'Name', 'Email', 'Contact', 'Attendance']],
            body: students.map(s => [
                s.student_id || '—',
                s.name || '—',
                s.email || '—',
                s.contact || '—',
                s.attendance != null ? `${Number(s.attendance).toFixed(1)}%` : '—',
            ]),
            styles: { fontSize: 8, cellPadding: 2.8 },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            bodyStyles: { textColor: [40, 40, 60] },
            margin: { left: 14, right: 14 },
        });
    }

    // ── Footer on every page ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...ORANGE);
        doc.rect(0, 284, W, 2, 'F');
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 286, W, 11, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 120);
        doc.text(`Page ${i} of ${pageCount}  |  Generated on ${date}`, W / 2, 293, { align: 'center' });
    }

    doc.save(`${(title || 'Class_Report').replace(/\s+/g, '_')}_Report.pdf`);
}

/* ─────────────────────────────────────────────────────────────────────────
   generateStudentReportPDF
   Produces a professionally-formatted 2-page single-student report:
     Page 1 – header · student info cards · additional fields · attendance charts
     Page 2 – subject marks bar chart · progress trend · subject-wise table
───────────────────────────────────────────────────────────────────────── */
export function generateStudentReportPDF({
    student,
    teacherName = '',
    title = '',
    desc = '',
    monthData = [],        // [{month, attendance}]
    marksData = [],        // [{subject, marks}]
    ecTrendData = [],      // [{month, credits}]
    subjects = [],         // [{name, score, total}]
    addFields = [],        // [{label, value}]
}) {
    if (!student) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;   // page width
    const NAVY = [26, 43, 75];
    const ORANGE = [234, 130, 10];
    const LIGHT = [240, 245, 255];
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    /* ── helpers ── */
    const sectionHeader = (label, y) => {
        doc.setFillColor(...NAVY);
        doc.rect(14, y - 4, 4, 10, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(label, 21, y + 3);
        return y + 12;
    };

    const infoCard = (label, value, x, y, w = 86) => {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(x, y, w, 18, 2, 2, 'F');
        doc.setFillColor(...NAVY);
        doc.rect(x, y, 3, 18, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 130, 150);
        doc.text(label, x + 6, y + 6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(String(value || '—'), x + 6, y + 13);
    };

    /* ── sector helper (donut chart) ── */
    const drawDonut = (cx, cy, r, pct, colPresent, colAbsent) => {
        const STEPS = 60;
        const TAU = Math.PI * 2;
        const presentSteps = Math.round((pct / 100) * STEPS);

        // Full circle — absent color (background)
        doc.setFillColor(...colAbsent);
        let px = cx + r * Math.cos(-Math.PI / 2);
        let py = cy + r * Math.sin(-Math.PI / 2);
        for (let i = 1; i <= STEPS; i++) {
            const a = -Math.PI / 2 + (i / STEPS) * TAU;
            const nx = cx + r * Math.cos(a);
            const ny = cy + r * Math.sin(a);
            doc.triangle(cx, cy, px, py, nx, ny, 'F');
            px = nx; py = ny;
        }
        // Present sector
        doc.setFillColor(...colPresent);
        px = cx + r * Math.cos(-Math.PI / 2);
        py = cy + r * Math.sin(-Math.PI / 2);
        for (let i = 1; i <= presentSteps; i++) {
            const a = -Math.PI / 2 + (i / STEPS) * TAU;
            const nx = cx + r * Math.cos(a);
            const ny = cy + r * Math.sin(a);
            doc.triangle(cx, cy, px, py, nx, ny, 'F');
            px = nx; py = ny;
        }
        // Inner white circle → donut
        doc.setFillColor(255, 255, 255);
        doc.circle(cx, cy, r * 0.55, 'F');
    };

    /* ── bar chart helper ── */
    const drawBarChart = (data, keyX, keyY, x, y, w, h, fillColor, maxVal) => {
        if (!data.length) return;
        const bw = Math.min((w - (data.length - 1) * 3) / data.length, 22);
        const gap = (w - bw * data.length) / Math.max(data.length - 1, 1);
        const max = maxVal || Math.max(...data.map(d => Number(d[keyY]) || 0), 1);

        // grid lines
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        [0, 0.25, 0.5, 0.75, 1].forEach(f => {
            const ly = y + h - f * h;
            doc.line(x, ly, x + w, ly);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(String(Math.round(f * max)), x - 1, ly + 1, { align: 'right' });
        });

        data.forEach((d, i) => {
            const val = Number(d[keyY]) || 0;
            const bh = (val / max) * h;
            const bx = x + i * (bw + gap);
            const by = y + h - bh;

            doc.setFillColor(...fillColor);
            doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');

            // value label
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            if (bh > 4) doc.text(String(val), bx + bw / 2, by - 1.5, { align: 'center' });

            // x-axis label
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text(String(d[keyX] || '').slice(0, 5), bx + bw / 2, y + h + 5, { align: 'center' });
        });
    };

    /* ── line chart helper ── */
    const drawLineChart = (data, keyX, keyY, x, y, w, h, strokeColor) => {
        if (data.length < 2) return;
        const max = Math.max(...data.map(d => Number(d[keyY]) || 0), 1);
        const pts = data.map((d, i) => ({
            px: x + (i / (data.length - 1)) * w,
            py: y + h - (Number(d[keyY]) / max) * h,
            val: Number(d[keyY]),
            label: String(d[keyX] || ''),
        }));

        // grid
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        [0, 0.25, 0.5, 0.75, 1].forEach(f => {
            const ly = y + h - f * h;
            doc.line(x, ly, x + w, ly);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(String(Math.round(f * max)), x - 1, ly + 1, { align: 'right' });
        });

        // line
        doc.setDrawColor(...strokeColor);
        doc.setLineWidth(0.8);
        for (let i = 0; i < pts.length - 1; i++) {
            doc.line(pts[i].px, pts[i].py, pts[i + 1].px, pts[i + 1].py);
        }
        // dots + labels
        pts.forEach(p => {
            doc.setFillColor(...strokeColor);
            doc.circle(p.px, p.py, 1.5, 'F');
            doc.setFillColor(255, 255, 255);
            doc.circle(p.px, p.py, 0.8, 'F');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...strokeColor);
            doc.text(String(p.val), p.px, p.py - 2.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            doc.text(p.label.slice(0, 4), p.px, y + h + 5, { align: 'center' });
        });
    };

    /* ── footer helper ── */
    const addFooter = (pageNum, pageTotal, studentName) => {
        doc.setFillColor(...ORANGE);
        doc.rect(0, 284, W, 2, 'F');
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 286, W, 11, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 120);
        doc.text(`Page ${pageNum} of ${pageTotal}  |  Student Report: ${studentName}  |  ${dateStr}`, W / 2, 293, { align: 'center' });
    };

    /* ════════ PAGE 1 ════════ */
    // Header
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title || student.name, 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by: ${teacherName || 'Teacher'}  |  ${dateStr}`, 14, 29);

    // Orange accent line
    doc.setFillColor(...ORANGE);
    doc.rect(0, 36, W, 3, 'F');

    let y = 50;

    // Student Information
    y = sectionHeader('Student Information', y);
    const si = [
        { label: 'Student Name', value: student.name },
        { label: 'Student ID', value: student.student_id },
        { label: 'Academic Year', value: student.year ? `Year ${student.year}` : '—' },
        { label: 'Attendance', value: student.attendance != null ? `${student.attendance}%` : '—' },
        { label: 'Email', value: student.email },
        { label: 'Contact', value: student.contact },
    ];
    for (let i = 0; i < si.length; i += 2) {
        infoCard(si[i].label, si[i].value, 14, y);
        infoCard(si[i + 1].label, si[i + 1].value, 110, y);
        y += 22;
    }
    y += 4;

    // Additional Information
    const validFields = addFields.filter(f => f.label && f.value);
    if (validFields.length > 0) {
        y = sectionHeader('Additional Information', y);
        validFields.forEach(f => {
            doc.setFillColor(255, 248, 235);
            doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
            doc.setFillColor(...ORANGE);
            doc.rect(14, y, 3, 16, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 120, 60);
            doc.text(f.label, 20, y + 6);
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...ORANGE);
            doc.text(String(f.value), 20, y + 13);
            y += 20;
        });
        y += 4;
    }

    // Performance Visualizations
    if (y > 200) { doc.addPage(); y = 20; }
    y = sectionHeader('Performance Visualizations', y);

    // Left: Donut chart
    const chartBoxW = 86;
    const chartBoxH = 55;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(14, y, chartBoxW, chartBoxH, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Overall Attendance', 14 + chartBoxW / 2, y + 8, { align: 'center' });
    const cx = 14 + 30;
    const cy = y + 35;
    const present = Number(student.attendance) || 0;
    drawing: {
        drawDonut(cx, cy, 16, present, [22, 163, 74], [239, 68, 68]);
    }
    // Legend
    const lx = cx + 22;
    doc.setFillColor(22, 163, 74);
    doc.rect(lx, cy - 13, 4, 4, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Present: ${present.toFixed(1)}%`, lx + 6, cy - 10);
    doc.setFillColor(239, 68, 68);
    doc.rect(lx, cy - 6, 4, 4, 'F');
    doc.text(`Absent: ${(100 - present).toFixed(1)}%`, lx + 6, cy - 3);

    // Right: Monthly Attendance bar
    doc.setFillColor(...LIGHT);
    doc.roundedRect(110, y, chartBoxW, chartBoxH, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Monthly Attendance', 110 + chartBoxW / 2, y + 8, { align: 'center' });
    if (monthData.length > 0) {
        drawBarChart(monthData, 'month', 'attendance', 120, y + 13, 68, 33, [34, 197, 94], 100);
    } else {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180);
        doc.text('No monthly data', 110 + chartBoxW / 2, y + chartBoxH / 2 + 2, { align: 'center' });
    }

    y += chartBoxH + 4;

    // ════════ PAGE 2 ════════
    doc.addPage();
    y = 20;

    // Subject Marks bar chart
    if (marksData.length > 0) {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(14, y, 182, 65, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text('Subject Marks', 105, y + 9, { align: 'center' });
        drawBarChart(marksData, 'subject', 'marks', 26, y + 14, 158, 40, [30, 64, 175], 100);
        y += 72;
    }

    // Progress Trend line chart
    if (ecTrendData.length >= 2) {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(14, y, 182, 65, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text('Progress Trend', 105, y + 9, { align: 'center' });
        drawLineChart(ecTrendData, 'month', 'credits', 26, y + 14, 158, 40, [124, 58, 237]);
        y += 72;
    }

    // Subject-wise Performance table
    const validSubjects = subjects.filter(s => s.name && s.score);
    if (validSubjects.length > 0) {
        y = sectionHeader('Subject-wise Performance', y + 6);

        const gradeOf = (score, total) => {
            const pct = (Number(score) / Number(total || 100)) * 100;
            if (pct >= 90) return ['A+', 'Outstanding'];
            if (pct >= 80) return ['A', 'Very Good'];
            if (pct >= 70) return ['B+', 'Good'];
            if (pct >= 60) return ['B', 'Satisfactory'];
            if (pct >= 50) return ['C', 'Average'];
            return ['F', 'Needs Improvement'];
        };

        const totalMarks = validSubjects.reduce((s, r) => s + Number(r.score || 0), 0);
        const totalOut = validSubjects.reduce((s, r) => s + Number(r.total || 100), 0);
        const totalPct = totalOut ? Math.round((totalMarks / totalOut) * 100) : 0;
        const highPct = Math.max(...validSubjects.map(r => Number(r.total) ? Math.round((Number(r.score) / Number(r.total)) * 100) : 0));
        const lowPct = Math.min(...validSubjects.map(r => Number(r.total) ? Math.round((Number(r.score) / Number(r.total)) * 100) : 0));

        autoTable(doc, {
            startY: y,
            head: [['Subject', 'Marks Obtained', 'Out Of', 'Percentage', 'Grade', 'Remarks']],
            body: [
                ...validSubjects.map(r => {
                    const pct = Number(r.total) ? Math.round((Number(r.score) / Number(r.total)) * 100) : 0;
                    const [grade, remark] = gradeOf(r.score, r.total);
                    return [r.name, r.score, r.total || 100, `${pct}%`, grade, remark];
                }),
                ['Total', totalMarks, totalOut, `${totalPct}%`, `High: ${highPct}%`, `Low: ${lowPct}%`],
            ],
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            bodyStyles: { textColor: [40, 40, 60] },
            margin: { left: 14, right: 14 },
            didParseCell(data) {
                // Total row — orange background
                if (data.row.index === validSubjects.length) {
                    data.cell.styles.fillColor = ORANGE;
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
        });
    }

    // Footers
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        addFooter(i, pages, student.name);
    }

    const safeName = (title || student.name).replace(/\s+/g, '_');
    doc.save(`${safeName}_Report.pdf`);
}

/**
 * Generate a Timetable PDF.
 * @param {object} opts
 * @param {string} opts.title          - e.g. "CSE Department Timetable" or "My Timetable — M. Gaur"
 * @param {Array}  opts.entries        - array of timetable entry objects
 * @param {string} [opts.teacherName]  - if personal timetable
 */
export function generateTimetablePDF({ title = 'Timetable', entries = [], teacherName = '' }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const NAVY = [26, 43, 75];
    const BLUE = [37, 99, 235];
    const LIGHT = [240, 245, 255];

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 22, 'F');

    doc.setFillColor(...BLUE);
    doc.rect(0, 22, W, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 14);

    if (teacherName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Teacher: ${teacherName}`, W - 14, 14, { align: 'right' });
    }

    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(8);
    doc.text(`Generated: ${dateStr}`, W - 14, 9, { align: 'right' });

    // ── Group entries by day ────────────────────────────────────────────────
    const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    for (const e of entries) {
        if (!grouped[e.day_of_week]) grouped[e.day_of_week] = [];
        grouped[e.day_of_week].push(e);
    }
    for (const day of Object.keys(grouped)) {
        grouped[day].sort((a, b) => a.period_number - b.period_number);
    }

    if (!entries.length) {
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(11);
        doc.text('No timetable entries found.', W / 2, 50, { align: 'center' });
        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
        return;
    }

    // ── Build table rows (Day | Time | Period | Subject | Room | Teacher) ──
    const rows = [];
    for (const day of DAY_ORDER) {
        if (!grouped[day]) continue;
        grouped[day].forEach((e, idx) => {
            rows.push([
                idx === 0 ? day : '',          // day shown only on first row of each day
                e.start_time ? `${e.start_time.slice(0, 5)} – ${e.end_time.slice(0, 5)}` : '',
                `P${e.period_number}`,
                e.subject || '',
                e.room || '',
                e.teacher_name || '',
            ]);
        });
    }

    autoTable(doc, {
        startY: 30,
        head: [['Day', 'Time', 'Period', 'Subject', 'Room', 'Teacher']],
        body: rows,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: NAVY,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: LIGHT, textColor: NAVY, cellWidth: 28 },
            1: { cellWidth: 32, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 55, fontStyle: 'bold' },
            4: { cellWidth: 28 },
            5: { cellWidth: 50, textColor: [37, 99, 235], fontStyle: 'italic' },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVY);
        doc.rect(0, doc.internal.pageSize.height - 10, W, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text('EduPortal — Timetable Export', 14, doc.internal.pageSize.height - 3.5);
        doc.text(`Page ${i} of ${pageCount}`, W - 14, doc.internal.pageSize.height - 3.5, { align: 'right' });
    }

    doc.save(`${title.replace(/[\s/]+/g, '_')}.pdf`);
}
