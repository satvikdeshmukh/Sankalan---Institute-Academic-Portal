require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    const users = await p.user.findMany({
        where: { role: 'TEACHER' },
        select: { id: true, email: true, departmentId: true }
    });
    console.log('TEACHERS:', JSON.stringify(users, null, 2));

    const students = await p.student.findMany({ take: 5, select: { id: true, studentId: true, departmentId: true } });
    console.log('STUDENTS (first 5):', JSON.stringify(students, null, 2));

    const depts = await p.department.findMany({ select: { id: true, name: true, shortId: true } });
    console.log('DEPARTMENTS:', JSON.stringify(depts, null, 2));

    await p.$disconnect();
})();
