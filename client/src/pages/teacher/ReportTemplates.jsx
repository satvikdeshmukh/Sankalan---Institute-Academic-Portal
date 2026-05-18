import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ─────────────────────────────────────────────
   PAGE CONSTANTS
───────────────────────────────────────────── */
const PW = 210;
const PH = 297;
const ML = 14;   // margin left
const MR = 14;   // margin right
const CW = PW - ML - MR;  // content width
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ─────────────────────────────────────────────
   SAFE DRAWING PRIMITIVES
   All bounds-checked to prevent jsPDF crashes
───────────────────────────────────────────── */
function rect(doc, x, y, w, h, style = 'F') {
    if (w > 0 && h > 0) doc.rect(x, y, w, h, style);
}

function rrect(doc, x, y, w, h, r, style = 'F') {
    if (w > 0 && h > 0) {
        const cr = Math.min(r, w / 2, h / 2);
        doc.roundedRect(x, y, w, h, cr, cr, style);
    }
}

function txt(doc, str, x, y, opts = {}) {
    doc.text(String(str ?? ''), x, y, opts);
}

/* Draw a mini sparkline (polyline) for trend data */
function sparkline(doc, data, x, y, w, h, rgb) {
    if (!data || data.length < 2) return;
    const max = Math.max(...data, 0.001);
    const pts = data.map((v, i) => [
        x + (i / (data.length - 1)) * w,
        y + h - (v / max) * h * 0.9
    ]);
    doc.setDrawColor(...rgb);
    doc.setLineWidth(0.9);
    for (let i = 0; i < pts.length - 1; i++) {
        doc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
    pts.forEach(([px, py]) => {
        doc.setFillColor(...rgb);
        doc.circle(px, py, 0.8, 'F');
    });
    doc.setLineWidth(0.2);
}

/* Draw a simple vertical bar chart */
function barchart(doc, items, x, y, w, h, barRgb, labelRgb) {
    if (!items || items.length === 0) return;
    const max = Math.max(...items.map(d => d.v || 0), 1);
    const n = items.length;
    const slotW = w / n;
    const barW = Math.min(slotW * 0.55, 16);

    // baseline
    doc.setDrawColor(210, 214, 220);
    doc.setLineWidth(0.2);
    doc.line(x, y + h, x + w, y + h);

    items.forEach((d, i) => {
        const bh = Math.max(((d.v || 0) / max) * h, 0.5);
        const bx = x + i * slotW + (slotW - barW) / 2;
        const by = y + h - bh;
        const rgb = d.rgb || barRgb;
        doc.setFillColor(...rgb);
        rrect(doc, bx, by, barW, bh, 1.5, 'F');
        // value label above bar
        doc.setFontSize(5.5);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...rgb);
        txt(doc, String(Math.round(d.v || 0)), bx + barW / 2, by - 1.2, { align: 'center' });
        // x-axis label
        doc.setFontSize(5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...labelRgb);
        txt(doc, String(d.l || d.label || '').slice(0, 8), bx + barW / 2, y + h + 4.5, { align: 'center' });
    });
}

/* Draw a horizontal bar chart — bars are strictly capped to available width */
function hbarchart(doc, items, x, y, w, h, defaultRgb, labelRgb) {
    if (!items || items.length === 0) return;
    const max = Math.max(...items.map(d => d.v || 0), 1);
    const n = items.length;
    const slotH = h / n;
    const barH = Math.min(slotH * 0.6, 9);
    const labelW = 34;  // fixed left label column width
    const valW = 12;    // space reserved on right for value text
    const barMaxW = w - labelW - valW; // bars cannot exceed this

    items.forEach((d, i) => {
        const bw = Math.max(((d.v || 0) / max) * barMaxW, 1);
        const by = y + i * slotH + (slotH - barH) / 2;
        const rgb = d.rgb || defaultRgb;
        // label on left
        doc.setFontSize(5.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...labelRgb);
        const lbl = String(d.l || '').length > 16 ? String(d.l || '').slice(0, 15) + '..' : String(d.l || '');
        txt(doc, lbl, x, by + barH * 0.75);
        // bar
        doc.setFillColor(...rgb);
        rrect(doc, x + labelW, by, bw, barH, 1.5, 'F');
        // value label right of bar
        doc.setFontSize(5.5);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...rgb);
        txt(doc, String(Math.round(d.v || 0)), x + labelW + bw + 2, by + barH * 0.75);
    });
}

/* Draw a donut chart */
function donutChart(doc, items, cx, cy, outerR, innerR) {
    if (!items || items.length === 0) return;
    const total = items.reduce((s, d) => s + (d.v || 0), 0);
    if (total === 0) return;
    const colors = [
        [99, 102, 241], [16, 185, 129], [245, 158, 11], [239, 68, 68],
        [139, 92, 246], [236, 72, 153], [14, 165, 233],
    ];
    let startAngle = -Math.PI / 2;
    const slices = [];

    items.forEach((d, i) => {
        const sliceAngle = ((d.v || 0) / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        const rgb = d.rgb || colors[i % colors.length];
        // Draw arc using many small triangles
        const steps = Math.max(Math.round(sliceAngle * 40), 8);
        doc.setFillColor(...rgb);
        for (let s = 0; s < steps; s++) {
            const a1 = startAngle + (s / steps) * sliceAngle;
            const a2 = startAngle + ((s + 1) / steps) * sliceAngle;
            // outer triangle
            const ox1 = cx + outerR * Math.cos(a1);
            const oy1 = cy + outerR * Math.sin(a1);
            const ox2 = cx + outerR * Math.cos(a2);
            const oy2 = cy + outerR * Math.sin(a2);
            const ix1 = cx + innerR * Math.cos(a1);
            const iy1 = cy + innerR * Math.sin(a1);
            const ix2 = cx + innerR * Math.cos(a2);
            const iy2 = cy + innerR * Math.sin(a2);
            // Quad as two triangles
            doc.triangle(ox1, oy1, ox2, oy2, ix1, iy1, 'F');
            doc.triangle(ox2, oy2, ix2, iy2, ix1, iy1, 'F');
        }
        const midAngle = startAngle + sliceAngle / 2;
        slices.push({ d, rgb, midAngle, pct: Math.round(((d.v || 0) / total) * 100) });
        startAngle = endAngle;
    });

    // No floating ring labels — caller should render a legend below
}

/* Draw 4 KPI boxes in a row */
function kpiRow(doc, items, y, boxH = 22) {
    const n = items.length;
    const gap = 3;
    const bw = (CW - gap * (n - 1)) / n;
    items.forEach((k, i) => {
        const bx = ML + i * (bw + gap);
        doc.setFillColor(...k.bg);
        rrect(doc, bx, y, bw, boxH, 2.5, 'F');
        if (k.border) {
            doc.setDrawColor(...k.border);
            doc.setLineWidth(0.4);
            rrect(doc, bx, y, bw, boxH, 2.5, 'S');
        }
        if (k.accent) {
            doc.setFillColor(...k.accent);
            rrect(doc, bx, y, 3, boxH, 1.5, 'F');
        }
        const cx = bx + (k.accent ? 3 : 0);
        const cw = bw - (k.accent ? 3 : 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...k.valColor);
        txt(doc, String(k.value), cx + cw / 2, y + boxH * 0.56, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...k.lblColor);
        txt(doc, k.label, cx + cw / 2, y + boxH * 0.84, { align: 'center' });
    });
}

/* Section heading with left accent bar */
function sectionHead(doc, label, y, accentRgb, textRgb) {
    doc.setFillColor(...accentRgb);
    rect(doc, ML, y, 3, 7, 'F');
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textRgb);
    txt(doc, label, ML + 5, y + 5.5);
}

/* Derive clean summary stats from raw API data */
function deriveStats(marks, monthly, selectedSubjects) {
    const fm = marks.filter(m => selectedSubjects.has(m.subjectOfferingId));
    const fa = monthly.filter(a => selectedSubjects.has(a.subjectOfferingId));
    const totalMarks = fm.reduce((s, m) => s + (m.marks || 0), 0);
    const avgAtt = fa.length
        ? Math.round(fa.reduce((s, a) => s + a.percentage, 0) / fa.length)
        : 0;

    // Monthly trend (with month+year label)
    const mmap = {};
    fa.forEach(a => {
        const k = `${a.year}-${String(a.month).padStart(2, '0')}`;
        if (!mmap[k]) mmap[k] = { vals: [], lbl: MONTH_LABELS[a.month - 1] + ' ' + a.year };
        mmap[k].vals.push(a.percentage);
    });
    const trend = Object.entries(mmap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, d]) => ({
            lbl: d.lbl,
            v: Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length)
        }));

    // Subject attendance
    const samap = {};
    fa.forEach(a => {
        const n = a.subjectOffering?.subject?.name || '?';
        if (!samap[n]) samap[n] = [];
        samap[n].push(a.percentage);
    });
    const subAtt = Object.entries(samap).map(([l, vals]) => ({
        l, v: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
    }));

    // Exam totals by type
    const emap = {};
    fm.forEach(m => { emap[m.examType] = (emap[m.examType] || 0) + m.marks; });
    const examTotals = Object.entries(emap).map(([l, v]) => ({ l, v }));

    // Subject-wise total marks
    const smap = {};
    fm.forEach(m => {
        const n = m.subjectOffering?.subject?.name || '?';
        smap[n] = (smap[n] || 0) + (m.marks || 0);
    });
    const subjectMarks = Object.entries(smap).map(([l, v]) => ({ l, v }));

    // Grouped marks by exam type + subject (for grouped bar chart)
    const groupedMarks = {};
    fm.forEach(m => {
        const exam = m.examType || '?';
        const sub = m.subjectOffering?.subject?.name || '?';
        if (!groupedMarks[exam]) groupedMarks[exam] = {};
        groupedMarks[exam][sub] = (groupedMarks[exam][sub] || 0) + (m.marks || 0);
    });

    return { totalMarks, avgAtt, atRisk: avgAtt > 0 && avgAtt < 75, trend, subAtt, examTotals, subjectMarks, groupedMarks };
}

/* Standard attendance+marks auto-tables */
function drawTables(doc, marks, monthly, selectedSubjects, headFill, altFill, startY, accentRgb) {
    let y = startY;

    const attRows = monthly
        .filter(a => selectedSubjects.has(a.subjectOfferingId))
        .map(a => [
            a.subjectOffering?.subject?.name || '—',
            MONTH_LABELS[a.month - 1] + ' ' + a.year,
            {
                content: Math.round(a.percentage) + '%',
                styles: {
                    fontStyle: 'bold',
                    halign: 'center',
                    textColor:
                        a.percentage >= 75 ? [5, 150, 105] :
                            a.percentage >= 50 ? [160, 80, 0] :
                                [200, 30, 30],
                },
            },
        ]);

    if (attRows.length > 0) {
        if (y > 220) { doc.addPage(); y = 16; }
        sectionHead(doc, 'Monthly Attendance', y, accentRgb, [40, 40, 55]);
        y += 10;
        doc.autoTable({
            startY: y,
            head: [['Subject', 'Month', 'Attendance']],
            body: attRows,
            theme: 'grid',
            headStyles: {
                fillColor: headFill,
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
            },
            alternateRowStyles: { fillColor: altFill },
            columnStyles: { 2: { halign: 'center' } },
            margin: { left: ML, right: MR },
        });
        y = doc.lastAutoTable.finalY + 7;
    }

    const markRows = marks
        .filter(m => selectedSubjects.has(m.subjectOfferingId))
        .map(m => [
            m.subjectOffering?.subject?.name || '—',
            m.examType,
            {
                content: String(m.marks),
                styles: { fontStyle: 'bold', halign: 'center', textColor: headFill },
            },
        ]);

    if (markRows.length > 0) {
        if (y > 220) { doc.addPage(); y = 16; }
        sectionHead(doc, 'Examination Marks', y, accentRgb, [40, 40, 55]);
        y += 10;
        doc.autoTable({
            startY: y,
            head: [['Subject', 'Exam Type', 'Marks']],
            body: markRows,
            theme: 'grid',
            headStyles: {
                fillColor: headFill,
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
            },
            alternateRowStyles: { fillColor: altFill },
            columnStyles: { 2: { halign: 'center' } },
            margin: { left: ML, right: MR },
        });
        y = doc.lastAutoTable.finalY + 7;
    }

    return y;
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE 1 — ROYAL INDIGO  (2-page: Info+Tables -> Analytics)
   Page 1: Title, Student Info, Attendance (pivoted), Exam Marks
   Page 2: Performance Analytics — 4 charts in 2x2 grid
═══════════════════════════════════════════════════════════════ */
function tpl_RoyalIndigo(doc, data, meta) {
    const { student: s, marks = [], monthly = [], selectedSubjects, remarks = '' } = data;
    const enr = (s.enrollments || [])[0];
    const st = deriveStats(marks, monthly, selectedSubjects);
    const BLUE = [65, 65, 200];
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });

    // ======== PAGE 1 ========

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Student Academic Report', PW / 2, 22, { align: 'center' });

    // Blue divider
    doc.setDrawColor(65, 65, 200);
    doc.setLineWidth(0.8);
    doc.line(ML + 20, 27, PW - MR - 20, 27);

    // Date (left) and Teacher (right) below divider
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 110);
    txt(doc, 'Date: ' + dateStr, ML, 35);
    doc.setFont(undefined, 'bold');
    txt(doc, 'Teacher: ' + (meta.teacherName || '---'), PW - MR, 35, { align: 'right' });

    // Student Information section
    let y = 44;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Student Information', ML, y);
    y += 7;

    const infoFields = [
        { label: 'Name:', value: s.fullName || '---' },
        { label: 'College ID:', value: s.studentId || '---' },
        { label: 'Department:', value: s.department?.name || '---' },
        { label: 'Year / Sem:', value: enr ? 'Year ' + enr.year + ' / Sem ' + enr.semester : '---' },
        { label: 'Section:', value: enr?.section || s.section || '---' },
    ];
    infoFields.forEach(function (f) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 70);
        txt(doc, f.label, ML + 8, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 80);
        txt(doc, f.value, ML + 50, y);
        y += 7;
    });
    y += 4;

    // Attendance table — PIVOTED (subjects as rows, months as columns)
    var filteredAtt = monthly.filter(function (a) { return selectedSubjects.has(a.subjectOfferingId); });

    if (filteredAtt.length > 0) {
        var monthSet = new Map();
        var subjectData = {};
        filteredAtt.forEach(function (a) {
            var mKey = a.year + '-' + String(a.month).padStart(2, '0');
            var mLabel = MONTH_LABELS[a.month - 1] + ' ' + a.year;
            monthSet.set(mKey, mLabel);
            var subName = (a.subjectOffering && a.subjectOffering.subject && a.subjectOffering.subject.name) || '---';
            if (!subjectData[subName]) subjectData[subName] = {};
            subjectData[subName][mKey] = Math.round(a.percentage);
        });
        var sortedMonths = Array.from(monthSet.entries()).sort(function (a, b) { return a[0].localeCompare(b[0]); });
        var monthLabels = sortedMonths.map(function (e) { return e[1]; });
        var monthKeys = sortedMonths.map(function (e) { return e[0]; });

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 80);
        txt(doc, 'Attendance', ML, y);
        y += 5;

        var attHead = ['Subject'].concat(monthLabels);
        var attBody = Object.entries(subjectData).map(function (entry) {
            var subName = entry[0];
            var months = entry[1];
            var row = [subName];
            monthKeys.forEach(function (mk) {
                var pct = months[mk];
                if (pct !== undefined) {
                    row.push({
                        content: pct + '%',
                        styles: {
                            fontStyle: 'bold',
                            halign: 'center',
                            textColor: pct >= 75 ? [5, 150, 105] : pct >= 50 ? [160, 80, 0] : [200, 30, 30],
                        }
                    });
                } else {
                    row.push({ content: '---', styles: { halign: 'center', textColor: [180, 180, 190] } });
                }
            });
            return row;
        });

        var colStyles = {};
        for (var c = 1; c <= monthKeys.length; c++) colStyles[c] = { halign: 'center', cellWidth: 'auto' };

        doc.autoTable({
            startY: y,
            head: [attHead],
            body: attBody,
            theme: 'grid',
            headStyles: {
                fillColor: BLUE,
                textColor: [255, 255, 255],
                fontSize: 6.5,
                fontStyle: 'bold',
                cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 7,
                cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
            },
            alternateRowStyles: { fillColor: [248, 248, 255] },
            columnStyles: Object.assign({ 0: { fontStyle: 'bold', cellWidth: 40 } }, colStyles),
            margin: { left: ML, right: MR },
            tableWidth: 'auto',
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // Exam Marks table — PIVOTED (subjects as rows, exam types as columns)
    var filteredMarks = marks.filter(function (m) { return selectedSubjects.has(m.subjectOfferingId); });

    if (filteredMarks.length > 0) {
        if (y > 220) { doc.addPage(); y = 16; }
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 80);
        txt(doc, 'Exam Marks', ML, y);
        y += 5;

        // Collect unique exam types (sorted alphabetically)
        var examTypeSet = {};
        filteredMarks.forEach(function (m) { examTypeSet[m.examType] = true; });
        var examTypes = Object.keys(examTypeSet).sort();

        // Build per-subject mark map: subjectName -> {examType: marks}
        var subjectMarkMap = {};
        filteredMarks.forEach(function (m) {
            var sub = (m.subjectOffering && m.subjectOffering.subject && m.subjectOffering.subject.name) || '---';
            if (!subjectMarkMap[sub]) subjectMarkMap[sub] = {};
            subjectMarkMap[sub][m.examType] = m.marks;
        });

        var markHead = ['Subject'].concat(examTypes);
        var markBody = Object.entries(subjectMarkMap).map(function (entry) {
            var sub = entry[0];
            var etMap = entry[1];
            var row = [sub];
            examTypes.forEach(function (et) {
                var v = etMap[et];
                row.push(v !== undefined
                    ? { content: String(v), styles: { fontStyle: 'bold', halign: 'center', textColor: BLUE } }
                    : { content: '---', styles: { halign: 'center', textColor: [180, 180, 190] } }
                );
            });
            return row;
        });

        var mColStyles = {};
        for (var mc = 1; mc <= examTypes.length; mc++) mColStyles[mc] = { halign: 'center', cellWidth: 'auto' };

        doc.autoTable({
            startY: y,
            head: [markHead],
            body: markBody,
            theme: 'grid',
            headStyles: {
                fillColor: BLUE,
                textColor: [255, 255, 255],
                fontSize: 7,
                fontStyle: 'bold',
                cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 7.5,
                cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
            },
            alternateRowStyles: { fillColor: [248, 248, 255] },
            columnStyles: Object.assign({ 0: { fontStyle: 'bold', cellWidth: 50 } }, mColStyles),
            margin: { left: ML, right: MR },
            tableWidth: 'auto',
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // Remarks on page 1 if space
    if (remarks && remarks.trim()) {
        if (y > 260) { doc.addPage(); y = 16; }
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 80);
        txt(doc, 'Teacher Remarks:', ML, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 80);
        var rl = doc.splitTextToSize(remarks, CW - 10);
        doc.text(rl.slice(0, 3), ML, y + 6);
    }

    // ======== PAGE 2 — PERFORMANCE ANALYTICS ========
    doc.addPage();
    y = 18;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Performance Analytics', ML, y);
    y += 12;

    var chartW = (CW - 8) / 2;
    var chartH = 62;

    // Top-left: Attendance Trend (line chart)
    doc.setFillColor(250, 250, 255);
    rrect(doc, ML, y, chartW, chartH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    doc.setLineWidth(0.3);
    rrect(doc, ML, y, chartW, chartH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Attendance Trend', ML + 5, y + 8);

    if (st.trend.length >= 2) {
        sparkline(doc, st.trend.map(function (t) { return t.v; }), ML + 6, y + 14, chartW - 12, chartH - 28, BLUE);
        doc.setFontSize(4);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(140, 140, 160);
        st.trend.forEach(function (t, i) {
            var px = ML + 6 + (i / (st.trend.length - 1)) * (chartW - 12);
            txt(doc, String(t.lbl || '').slice(0, 3), px, y + chartH - 5, { align: 'center' });
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'Not enough data', ML + chartW / 2, y + chartH / 2, { align: 'center' });
    }

    // Top-right: Marks by Exam Type
    var cx2 = ML + chartW + 8;
    doc.setFillColor(250, 250, 255);
    rrect(doc, cx2, y, chartW, chartH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, cx2, y, chartW, chartH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Marks by Exam Type', cx2 + 5, y + 8);

    if (st.examTotals.length > 0) {
        var examColors = [[245, 158, 11], [99, 102, 241], [16, 185, 129], [239, 68, 68], [139, 92, 246]];
        var coloredExam = st.examTotals.map(function (e, i) { return Object.assign({}, e, { rgb: examColors[i % examColors.length] }); });
        barchart(doc, coloredExam, cx2 + 4, y + 13, chartW - 8, chartH - 28, BLUE, [120, 120, 140]);
        doc.setFontSize(4.5);
        var lx = cx2 + 5;
        coloredExam.forEach(function (e) {
            doc.setFillColor.apply(doc, e.rgb);
            rect(doc, lx, y + chartH - 9, 4, 3, 'F');
            doc.setTextColor.apply(doc, e.rgb);
            doc.setFont(undefined, 'normal');
            var elbl = String(e.l || '').slice(0, 10);
            txt(doc, elbl, lx + 5, y + chartH - 6.5);
            lx += doc.getTextWidth(elbl) + 9;
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No exam data', cx2 + chartW / 2, y + chartH / 2, { align: 'center' });
    }

    y += chartH + 8;
    var bottomH = 75;

    // Bottom-left: Subject-wise Avg Attendance (donut + legend inside card)
    doc.setFillColor(250, 250, 255);
    rrect(doc, ML, y, chartW, bottomH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, ML, y, chartW, bottomH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Subject-wise Avg Attendance', ML + 5, y + 8);

    if (st.subAtt.length > 0) {
        var donutCx = ML + chartW / 2;
        var donutCy = y + 34;
        donutChart(doc, st.subAtt, donutCx, donutCy, 15, 8);
        // Legend below donut, inside card
        var donutColors = [[99, 102, 241], [16, 185, 129], [245, 158, 11], [239, 68, 68], [139, 92, 246], [236, 72, 153]];
        doc.setFontSize(5);
        var ly = donutCy + 20;
        st.subAtt.forEach(function (sa, i) {
            var rgb = donutColors[i % donutColors.length];
            doc.setFillColor.apply(doc, rgb);
            rect(doc, ML + 6, ly - 2.5, 4, 3, 'F');
            doc.setFont(undefined, 'bold');
            doc.setTextColor.apply(doc, rgb);
            var slabel = String(sa.l || '');
            if (slabel.length > 24) slabel = slabel.slice(0, 24) + '..';
            txt(doc, slabel + ': ' + sa.v + '%', ML + 12, ly);
            ly += 5;
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No attendance data', ML + chartW / 2, y + bottomH / 2, { align: 'center' });
    }

    // Bottom-right: Total Marks by Subject (horizontal bar — capped inside card)
    doc.setFillColor(250, 250, 255);
    rrect(doc, cx2, y, chartW, bottomH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, cx2, y, chartW, bottomH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Total Marks by Subject', cx2 + 5, y + 8);

    if (st.subjectMarks.length > 0) {
        var subColors = [[245, 158, 11], [16, 185, 129], [139, 92, 246], [99, 102, 241], [236, 72, 153]];
        var coloredSubs = st.subjectMarks.map(function (sm, i) { return Object.assign({}, sm, { rgb: subColors[i % subColors.length] }); });
        hbarchart(doc, coloredSubs, cx2 + 5, y + 14, chartW - 10, bottomH - 22, BLUE, [80, 80, 100]);
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No marks data', cx2 + chartW / 2, y + bottomH / 2, { align: 'center' });
    }

    y += bottomH + 10;

    // ======== Progress Trend (Extracurricular Credits) ========
    var progressTrend = data.progressTrend || [];
    var hasCredits = progressTrend.some(function (d) { return (d['Credits'] || d.Credits || 0) > 0; });
    var ptH = 50;

    doc.setFillColor(248, 255, 252);
    rrect(doc, ML, y, CW, ptH, 3, 'F');
    doc.setDrawColor(180, 240, 210);
    doc.setLineWidth(0.3);
    rrect(doc, ML, y, CW, ptH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(5, 130, 80);
    txt(doc, 'Progress Trend  (Extracurricular Credits per Month)', ML + 5, y + 8);

    if (hasCredits) {
        var ptVals = progressTrend.map(function (d) { return d['Credits'] || d.Credits || 0; });
        var ptMax = Math.max.apply(null, ptVals.concat([1]));
        var ptX = ML + 6;
        var ptY = y + 14;
        var ptW = CW - 12;
        var ptHH = ptH - 24;
        // Draw baseline
        doc.setDrawColor(200, 230, 215);
        doc.setLineWidth(0.2);
        doc.line(ptX, ptY + ptHH, ptX + ptW, ptY + ptHH);
        // Draw line chart
        var ptPts = ptVals.map(function (v, i) {
            return [ptX + (i / (ptVals.length - 1)) * ptW, ptY + ptHH - (v / ptMax) * ptHH * 0.9];
        });
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1.2);
        for (var pi = 0; pi < ptPts.length - 1; pi++) {
            doc.line(ptPts[pi][0], ptPts[pi][1], ptPts[pi + 1][0], ptPts[pi + 1][1]);
        }
        // dots
        doc.setFillColor(16, 185, 129);
        ptPts.forEach(function (pt) { doc.circle(pt[0], pt[1], 0.9, 'F'); });
        // x-axis month labels
        doc.setFontSize(4);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(140, 160, 150);
        progressTrend.forEach(function (d, i) {
            var px = ptX + (i / (progressTrend.length - 1)) * ptW;
            txt(doc, String(d.name || '').slice(0, 3), px, ptY + ptHH + 5, { align: 'center' });
        });
        // total credits
        var totalCredits = ptVals.reduce(function (a, b) { return a + b; }, 0);
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(5, 130, 80);
        txt(doc, 'Total: ' + totalCredits + ' credits', ML + CW - 4, y + 8, { align: 'right' });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 180, 170);
        txt(doc, 'No extracurricular credits recorded', ML + CW / 2, y + ptH / 2, { align: 'center' });
    }

    y += ptH + 10;

    // ======== Session Attendance — Visual Heatmap (matches dashboard) ========
    var daily = data.daily || [];
    if (daily.length > 0) {
        // Group daily records by subject, then by month
        var sessSubjects = {}; // subjectName -> { offeringId, months: { 'YYYY-M': { year, month, days: {day: status} } } }

        daily.forEach(function (d) {
            // Dashboard filter uses d.offeringId; fall back to d.subjectOfferingId
            var subId = d.offeringId || d.subjectOfferingId;
            if (!selectedSubjects.has(subId)) return;
            var subName = (d.subjectOffering && d.subjectOffering.subject && d.subjectOffering.subject.name) || '---';
            if (!sessSubjects[subName]) sessSubjects[subName] = { months: {} };
            var dt = new Date(d.date);
            var mk = dt.getFullYear() + '-' + (dt.getMonth() + 1);
            if (!sessSubjects[subName].months[mk]) {
                sessSubjects[subName].months[mk] = { year: dt.getFullYear(), month: dt.getMonth() + 1, days: {} };
            }
            // status is boolean true=present, false=absent (or string fallback)
            var isPresent = (d.status === true || d.status === 'PRESENT' || d.status === 'present');
            var isAbsent = (d.status === false || d.status === 'ABSENT' || d.status === 'absent');
            sessSubjects[subName].months[mk].days[dt.getDate()] = isPresent ? 1 : (isAbsent ? 0 : -1);
        });

        var subjectNames = Object.keys(sessSubjects);
        if (subjectNames.length > 0) {
            if (y > 220) { doc.addPage(); y = 16; }

            // Section heading
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 30, 80);
            txt(doc, 'Session Attendance', ML, y);

            // Legend top-right
            doc.setFontSize(6);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(16, 185, 129);
            rect(doc, PW - MR - 36, y - 3, 5, 4, 'F');
            doc.setTextColor(80, 80, 80);
            txt(doc, 'PRESENT', PW - MR - 30, y);
            doc.setFillColor(239, 68, 68);
            rect(doc, PW - MR - 10, y - 3, 5, 4, 'F');
            txt(doc, 'ABSENT', PW - MR - 4, y);

            y += 7;

            var SQ = 3.2;    // square size in mm
            var GAP = 0.7;   // gap between squares
            var SLOT = SQ + GAP;
            var COLS = 7;    // 7 days per row

            subjectNames.forEach(function (subName) {
                var subData = sessSubjects[subName];
                var sortedMonths = Object.values(subData.months).sort(function (a, b) {
                    return a.year !== b.year ? a.year - b.year : a.month - b.month;
                });

                // Subject name
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(65, 65, 200);
                txt(doc, subName, ML, y);
                y += 5;

                // Lay out months horizontally; wrap if they overflow page width
                var monthBlockW = COLS * SLOT + 4; // approx width of one month block
                var monthsPerRow = Math.max(1, Math.floor(CW / (monthBlockW + 6)));
                var mx = ML;

                sortedMonths.forEach(function (mData, mi) {
                    if (mi > 0 && mi % monthsPerRow === 0) {
                        // new row of months
                        y += 42; // height of one calendar block
                        mx = ML;
                        if (y > PH - 30) { doc.addPage(); y = 16; mx = ML; }
                    }

                    var daysInMonth = new Date(mData.year, mData.month, 0).getDate();
                    var firstDayOfWeek = new Date(mData.year, mData.month - 1, 1).getDay(); // 0=Sun

                    // Month label
                    doc.setFontSize(5.5);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(100, 100, 120);
                    txt(doc, MONTH_LABELS[mData.month - 1] + ' ' + mData.year, mx, y);

                    var gridY = y + 4;

                    // Draw squares: blank for offset, then each day
                    var cellCount = firstDayOfWeek + daysInMonth;
                    for (var ci = 0; ci < cellCount; ci++) {
                        var col = ci % COLS;
                        var row = Math.floor(ci / COLS);
                        var sqX = mx + col * SLOT;
                        var sqY = gridY + row * SLOT;

                        if (ci < firstDayOfWeek) {
                            // Empty offset cell (light gray)
                            doc.setFillColor(235, 235, 238);
                            // don't draw, just skip
                        } else {
                            var day = ci - firstDayOfWeek + 1;
                            var status = mData.days[day];
                            if (status === 1) {
                                doc.setFillColor(16, 185, 129);  // green - present
                            } else if (status === 0) {
                                doc.setFillColor(239, 68, 68);   // red - absent
                            } else {
                                doc.setFillColor(210, 210, 218); // gray - no record
                            }
                            rrect(doc, sqX, sqY, SQ, SQ, 0.5, 'F');
                        }
                    }

                    mx += monthBlockW + 8;
                });

                // Estimate rows used by last batch of months
                var lastBatchMonths = sortedMonths.slice(-(((sortedMonths.length - 1) % monthsPerRow) + 1));
                var maxRows = 0;
                lastBatchMonths.forEach(function (m) {
                    var dInM = new Date(m.year, m.month, 0).getDate();
                    var first = new Date(m.year, m.month - 1, 1).getDay();
                    var rows = Math.ceil((first + dInM) / COLS);
                    if (rows > maxRows) maxRows = rows;
                });
                y += 4 + maxRows * SLOT + 6; // label + grid + gap
                if (y > PH - 30) { doc.addPage(); y = 16; }
            });
        }
    }

    // FOOTER on all pages
    var pages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(65, 65, 200);
        doc.setLineWidth(0.4);
        doc.line(ML, PH - 14, PW - MR, PH - 14);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 160);
        txt(doc, 'Student Academic Report  |  Teacher: ' + (meta.teacherName || '---') + '  |  Page ' + p + ' of ' + pages, PW / 2, PH - 8, { align: 'center' });
    }
}


export const STUDENT_TEMPLATES = [
    {
        id: 'royal',
        name: 'Royal Indigo',
        desc: 'Deep navy header · Indigo accents · Grid tables',
        color: 'from-[#1e1e64] to-[#6366f1]',
        headerColor: '#1e1e64',
        accentColor: '#6366f1',
        fn: tpl_RoyalIndigo,
    },
];

export const CLASS_TEMPLATES = STUDENT_TEMPLATES.map(t => ({ ...t }));

/* ═══════════════════════════════════════════════════════════════
   EXPORTED GENERATORS
═══════════════════════════════════════════════════════════════ */

export function generateStudentPDF(templateId, data, meta) {
    const tpl = STUDENT_TEMPLATES.find(t => t.id === templateId) || STUDENT_TEMPLATES[0];
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    tpl.fn(doc, data, meta);
    doc.save(`report_${(data.student?.studentId || 'student').replace(/\s+/g, '_')}_${tpl.id}.pdf`);
}


export function generateClassPDF(templateId, data, meta) {
    const { offering, students = [], examTypes = [], remarks = '' } = data;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const BLUE = [65, 65, 200];
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const subject = offering?.subject?.name || '---';
    const dept = meta?.department || offering?.department?.name || offering?.subject?.department?.name || '---';
    const teacherName = meta?.teacherName || '---';

    // ======== PAGE 1 ========

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Class Academic Report', PW / 2, 22, { align: 'center' });

    // Blue divider
    doc.setDrawColor(65, 65, 200);
    doc.setLineWidth(0.8);
    doc.line(ML + 20, 27, PW - MR - 20, 27);

    // Date left, Teacher right
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 110);
    txt(doc, 'Date: ' + dateStr, ML, 35);
    doc.setFont(undefined, 'bold');
    txt(doc, 'Teacher: ' + teacherName, PW - MR, 35, { align: 'right' });

    // Class Information
    let y = 44;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Class Information', ML, y);
    y += 7;

    const classFields = [
        { label: 'Subject:', value: subject },
        { label: 'Department:', value: dept },
        { label: 'Year / Sem:', value: (offering?.year ? 'Year ' + offering.year : '---') + (offering?.semester ? ' / Sem ' + offering.semester : '') },
        { label: 'Section:', value: offering?.section || '---' },
        { label: 'Total Students:', value: String(students.length) },
    ];
    classFields.forEach(function (f) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(50, 50, 70);
        txt(doc, f.label, ML + 8, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 80);
        txt(doc, f.value, ML + 55, y);
        y += 7;
    });
    y += 4;

    // Student Marks Table — students as rows, exam types as columns + Avg Att
    if (students.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 80);
        txt(doc, 'Student Performance', ML, y);
        y += 5;

        var markHead = ['#', 'Student', 'ID'].concat(examTypes).concat(['Total', 'Avg Att%']);
        var markBody = students.map(function (st, idx) {
            var row = [String(idx + 1), st.fullName || '---', st.studentId || '---'];
            examTypes.forEach(function (et) {
                var v = st.marks[et];
                row.push(v !== undefined
                    ? { content: String(v), styles: { halign: 'center', fontStyle: 'bold', textColor: BLUE } }
                    : { content: '---', styles: { halign: 'center', textColor: [180, 180, 190] } }
                );
            });
            row.push(
                { content: String(st.totalMarks), styles: { halign: 'center', fontStyle: 'bold', textColor: [30, 30, 80] } },
                {
                    content: st.avgAtt + '%',
                    styles: {
                        halign: 'center', fontStyle: 'bold',
                        textColor: st.avgAtt >= 75 ? [5, 150, 105] : st.avgAtt >= 50 ? [160, 80, 0] : [200, 30, 30],
                    },
                }
            );
            return row;
        });

        var examColStyles = {};
        for (var ec = 3; ec < 3 + examTypes.length + 2; ec++) examColStyles[ec] = { halign: 'center', cellWidth: 'auto' };

        doc.autoTable({
            startY: y,
            head: [markHead],
            body: markBody,
            theme: 'grid',
            headStyles: {
                fillColor: BLUE, textColor: [255, 255, 255],
                fontSize: 6.5, fontStyle: 'bold', halign: 'center',
                cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
            },
            bodyStyles: { fontSize: 7, cellPadding: { top: 2, right: 2, bottom: 2, left: 2 } },
            alternateRowStyles: { fillColor: [248, 248, 255] },
            columnStyles: Object.assign(
                { 0: { halign: 'center', cellWidth: 8 }, 1: { fontStyle: 'bold', cellWidth: 45 }, 2: { cellWidth: 18 } },
                examColStyles
            ),
            margin: { left: ML, right: MR },
            tableWidth: 'auto',
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    // Remarks
    if (remarks && remarks.trim()) {
        if (y > 260) { doc.addPage(); y = 16; }
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 80);
        txt(doc, 'Teacher Remarks:', ML, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 80);
        var rl = doc.splitTextToSize(remarks, CW - 10);
        doc.text(rl.slice(0, 3), ML, y + 6);
    }

    // ======== PAGE 2 — CLASS PERFORMANCE ANALYTICS ========
    doc.addPage();
    y = 18;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 80);
    txt(doc, 'Class Performance Analytics', ML, y);
    y += 12;

    var chartW = (CW - 8) / 2;
    var chartH = 62;
    var subColors2 = [[245, 158, 11], [99, 102, 241], [16, 185, 129], [239, 68, 68], [139, 92, 246]];

    // Attendance trend from offering monthly data
    var classTrend = (function () {
        var mmap = {};
        (offering?.monthly || []).forEach(function (a) {
            var k = a.year + '-' + String(a.month).padStart(2, '0');
            if (!mmap[k]) mmap[k] = { vals: [], month: a.month, year: a.year };
            mmap[k].vals.push(a.percentage);
        });
        return Object.entries(mmap)
            .sort(function (a, b) { return a[0].localeCompare(b[0]); })
            .map(function (entry) {
                var d = entry[1];
                return { v: Math.round(d.vals.reduce(function (s, v) { return s + v; }, 0) / d.vals.length), lbl: MONTH_LABELS[d.month - 1] };
            });
    })();

    // Exam average scores
    var examAvgs = examTypes.map(function (et) {
        var vals = students.filter(function (s) { return s.marks[et] !== undefined; }).map(function (s) { return s.marks[et]; });
        return { l: et, v: vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0 };
    });

    // Attendance distribution
    var attDistColors = [[16, 185, 129], [245, 158, 11], [239, 68, 68]];
    var attDist = [
        { l: '>=75%', v: students.filter(function (s) { return s.avgAtt >= 75; }).length, rgb: attDistColors[0] },
        { l: '50-74%', v: students.filter(function (s) { return s.avgAtt >= 50 && s.avgAtt < 75; }).length, rgb: attDistColors[1] },
        { l: '<50%', v: students.filter(function (s) { return s.avgAtt < 50; }).length, rgb: attDistColors[2] },
    ].filter(function (d) { return d.v > 0; });

    // Top 6 students by total marks
    var topStudents = students
        .slice()
        .sort(function (a, b) { return b.totalMarks - a.totalMarks; })
        .slice(0, 6)
        .map(function (s, i) {
            var firstName = s.fullName ? s.fullName.split(' ')[0] : '---';
            return { l: firstName, v: s.totalMarks, rgb: subColors2[i % subColors2.length] };
        });

    // Top-left: Class Attendance Trend
    doc.setFillColor(250, 250, 255);
    rrect(doc, ML, y, chartW, chartH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    doc.setLineWidth(0.3);
    rrect(doc, ML, y, chartW, chartH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Class Attendance Trend', ML + 5, y + 8);

    if (classTrend.length >= 2) {
        sparkline(doc, classTrend.map(function (t) { return t.v; }), ML + 6, y + 14, chartW - 12, chartH - 28, BLUE);
        doc.setFontSize(4);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(140, 140, 160);
        classTrend.forEach(function (t, i) {
            var px = ML + 6 + (i / (classTrend.length - 1)) * (chartW - 12);
            txt(doc, String(t.lbl || '').slice(0, 3), px, y + chartH - 5, { align: 'center' });
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'Not enough data', ML + chartW / 2, y + chartH / 2, { align: 'center' });
    }

    // Top-right: Avg Score by Exam Type
    var cx2 = ML + chartW + 8;
    doc.setFillColor(250, 250, 255);
    rrect(doc, cx2, y, chartW, chartH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, cx2, y, chartW, chartH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Avg Score by Exam Type', cx2 + 5, y + 8);

    if (examAvgs.length > 0) {
        var coloredExam2 = examAvgs.map(function (e, i) { return Object.assign({}, e, { rgb: subColors2[i % subColors2.length] }); });
        barchart(doc, coloredExam2, cx2 + 4, y + 13, chartW - 8, chartH - 28, BLUE, [120, 120, 140]);
        doc.setFontSize(4.5);
        var lx2 = cx2 + 5;
        coloredExam2.forEach(function (e) {
            doc.setFillColor.apply(doc, e.rgb);
            rect(doc, lx2, y + chartH - 9, 4, 3, 'F');
            doc.setTextColor.apply(doc, e.rgb);
            doc.setFont(undefined, 'normal');
            var elbl = String(e.l || '').slice(0, 10);
            txt(doc, elbl, lx2 + 5, y + chartH - 6.5);
            lx2 += doc.getTextWidth(elbl) + 9;
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No exam data', cx2 + chartW / 2, y + chartH / 2, { align: 'center' });
    }

    y += chartH + 8;
    var bottomH = 75;

    // Bottom-left: Attendance Distribution (donut)
    doc.setFillColor(250, 250, 255);
    rrect(doc, ML, y, chartW, bottomH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, ML, y, chartW, bottomH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Attendance Distribution', ML + 5, y + 8);

    if (attDist.length > 0) {
        donutChart(doc, attDist, ML + chartW / 2, y + 34, 15, 8);
        doc.setFontSize(5);
        var ly2 = y + 54;
        attDist.forEach(function (d) {
            doc.setFillColor.apply(doc, d.rgb);
            rect(doc, ML + 6, ly2 - 2.5, 4, 3, 'F');
            doc.setFont(undefined, 'bold');
            doc.setTextColor.apply(doc, d.rgb);
            txt(doc, d.l + ': ' + d.v + ' students', ML + 12, ly2);
            ly2 += 5;
        });
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No attendance data', ML + chartW / 2, y + bottomH / 2, { align: 'center' });
    }

    // Bottom-right: Top Students by Total Marks (horizontal bar)
    doc.setFillColor(250, 250, 255);
    rrect(doc, cx2, y, chartW, bottomH, 3, 'F');
    doc.setDrawColor(220, 225, 240);
    rrect(doc, cx2, y, chartW, bottomH, 3, 'S');
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(65, 65, 200);
    txt(doc, 'Top Students by Total Marks', cx2 + 5, y + 8);

    if (topStudents.length > 0) {
        hbarchart(doc, topStudents, cx2 + 5, y + 14, chartW - 10, bottomH - 22, BLUE, [80, 80, 100]);
    } else {
        doc.setFontSize(7); doc.setTextColor(160, 160, 180);
        txt(doc, 'No marks data', cx2 + chartW / 2, y + bottomH / 2, { align: 'center' });
    }

    // Footer on all pages
    var pages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(65, 65, 200);
        doc.setLineWidth(0.4);
        doc.line(ML, PH - 14, PW - MR, PH - 14);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 160);
        txt(doc, 'Class Academic Report  |  ' + subject + '  |  Teacher: ' + teacherName + '  |  Page ' + p + ' of ' + pages, PW / 2, PH - 8, { align: 'center' });
    }

    doc.save('class_' + subject.replace(/\s+/g, '_') + '_' + templateId + '.pdf');
}
