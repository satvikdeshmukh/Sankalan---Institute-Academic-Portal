const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();
(async () => {
    const out = [];
    const deptName = 'CSE';

    // Test the exact query used in hod.js strategy 2
    const found = await p.user.findMany({
        where: {
            role: 'teacher',
            profile: { department: deptName },
        },
        include: { profile: true }
    });
    out.push(`Strategy 2 (profile.department=${deptName}): found ${found.length} teachers`);
    found.forEach(u => out.push(`  => ${u.email} | dept: ${u.profile?.department}`));

    // Also try to see Mayank's exact userId
    const mayank = await p.user.findUnique({ where: { email: 'gaurmayank629@gmail.com' }, include: { profile: true, teacherAssignment: true } });
    if (mayank) {
        out.push(`\nMayank: id=${mayank.id} profileDept=${mayank.profile?.department} assignment=${JSON.stringify(mayank.teacherAssignment)}`);
    }

    fs.writeFileSync('_debug_out2.txt', out.join('\n'));
    console.log('Done');
    await p.$disconnect();
})();
