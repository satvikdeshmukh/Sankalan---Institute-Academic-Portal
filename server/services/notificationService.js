const nodemailer = require('nodemailer');
const axios = require('axios');

// ── Email transporter ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// ── Build HTML email ──────────────────────────────────────────────────────
function buildEmail(student) {
    const isHigh = student.risk_level === 'HIGH_RISK';
    const color  = isHigh ? '#ef4444' : '#f59e0b';
    const label  = isHigh ? '🚨 HIGH RISK — Attendance Shortage' : '⚠️ Attendance Warning';
    return {
        from: `"Sankalan Academic System" <${process.env.EMAIL_FROM}>`,
        to: student.email,
        subject: isHigh
            ? '🚨 URGENT: Attendance Shortage — Sankalan'
            : '⚠️ Attendance Warning — Sankalan',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;
                    border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:${color};padding:20px 28px">
                <h2 style="color:#fff;margin:0;font-size:18px">${label}</h2>
            </div>
            <div style="padding:28px">
                <p style="margin:0 0 12px">Dear <strong>${student.name || 'Student'}</strong>,</p>
                <p style="color:#475569;margin:0 0 16px">
                    Your current attendance has fallen below the required threshold.
                </p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
                    <tr style="background:#f8fafc">
                        <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Current Attendance</td>
                        <td style="padding:10px 14px;font-weight:700;color:${color};font-size:18px;border-bottom:1px solid #e5e7eb">
                            ${student.attendance?.toFixed ? student.attendance.toFixed(1) : student.attendance}%
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Risk Level</td>
                        <td style="padding:10px 14px;color:${color};font-weight:600;border-bottom:1px solid #e5e7eb">${student.risk_level}</td>
                    </tr>
                    <tr style="background:#f8fafc">
                        <td style="padding:10px 14px;font-weight:600;color:#374151">Required Minimum</td>
                        <td style="padding:10px 14px;font-weight:600;color:#22c55e">75%</td>
                    </tr>
                </table>
                <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
                    <p style="margin:0;color:#854d0e;font-size:14px">
                        ${isHigh
                            ? 'You are at HIGH RISK of being detained. Please contact your HOD immediately.'
                            : 'Please improve your attendance to avoid falling into the High Risk category.'
                        }
                    </p>
                </div>
                <p style="color:#94a3b8;font-size:12px;margin:0">
                    Regards,<br><strong style="color:#374151">Sankalan Academic System</strong>
                </p>
            </div>
        </div>`
    };
}

// ── Send SMS via Fast2SMS ─────────────────────────────────────────────────
async function sendSMS(phone, message) {
    if (!phone || !process.env.FAST2SMS_API_KEY) return;
    await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
            authorization: process.env.FAST2SMS_API_KEY,
            message,
            language: 'english',
            route: 'q',
            numbers: phone,
        },
        timeout: 8000,
    });
}

// ── Main: send email + SMS for one student ────────────────────────────────
async function sendRiskNotification(student) {
    const tasks = [];

    if (student.email) {
        tasks.push(
            transporter.sendMail(buildEmail(student))
                .catch(err => console.warn(`[Notify] Email failed ${student.student_id}:`, err.message))
        );
    }

    if (student.phone) {
        const pct = student.attendance?.toFixed ? student.attendance.toFixed(1) : student.attendance;
        const sms = student.risk_level === 'HIGH_RISK'
            ? `Sankalan URGENT: Your attendance is ${pct}%. You are at HIGH RISK of detention. Contact HOD immediately.`
            : `Sankalan Alert: Your attendance is ${pct}%. Please improve to avoid shortage.`;
        tasks.push(
            sendSMS(student.phone, sms)
                .catch(err => console.warn(`[Notify] SMS failed ${student.student_id}:`, err.message))
        );
    }

    await Promise.allSettled(tasks);
}

module.exports = { sendRiskNotification };