const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Verification Script ---');

    try {
        // 1. Find a department
        const dept = await prisma.department.findFirst();
        if (!dept) {
                console.log('No department found. Skipping test.');
                return;
        }
        console.log(`Using department: ${dept.name}`);

        // 2. Create a subject with Year 2, Semester 3
        const subject = await prisma.subject.create({
            data: {
                name: 'Test Subject ' + Date.now(),
                code: 'TEST101',
                year: 2,
                semester: 3,
                departmentId: dept.id
            }
        });
        console.log(`Created Subject: ${subject.name} (Year: ${subject.year}, Sem: ${subject.semester})`);

        // 3. Find a teacher
        const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
        if (!teacher) {
                console.log('No teacher found. Skipping offering test.');
                return;
        }

        // 4. Create an offering (should inherit Year 2, Sem 3)
        const offering = await prisma.subjectOffering.create({
            data: {
                subjectId: subject.id,
                teacherId: teacher.id,
                year: subject.year,
                semester: subject.semester,
                section: 'A',
                academicYear: '2026-2027'
            }
        });
        console.log(`Created Offering: Year ${offering.year}, Sem ${offering.semester}, Section ${offering.section}`);

        // 5. Create two students in the same department
        // Student A: Year 2, Semester 3
        // Student B: Year 1, Semester 1
        const studentA = await prisma.student.create({
            data: {
                studentId: 'TEST-A-' + Date.now(),
                fullName: 'Student A (Correct Year/Sem)',
                departmentId: dept.id,
                enrollments: {
                    create: { year: 2, semester: 3, academicYear: '2026-2027' }
                }
            }
        });
        const studentB = await prisma.student.create({
            data: {
                studentId: 'TEST-B-' + Date.now(),
                fullName: 'Student B (Wrong Year/Sem)',
                departmentId: dept.id,
                enrollments: {
                    create: { year: 1, semester: 1, academicYear: '2026-2027' }
                }
            }
        });

        console.log(`Created Students: ${studentA.fullName}, ${studentB.fullName}`);

        // 6. Test Enrollment Preview (should only show Student A)
        // Note: the preview logic in subjects.js uses offering.semester which we just set.
        const previewStudents = await prisma.student.findMany({
            where: {
                departmentId: dept.id,
                enrollments: {
                    some: {
                        year: offering.year,
                        semester: offering.semester,
                        section: offering.section
                    }
                }
            }
        });

        const hasA = previewStudents.some(s => s.id === studentA.id);
        const hasB = previewStudents.some(s => s.id === studentB.id);

        console.log(`Preview Test: Has Student A? ${hasA} (Expected: true)`);
        console.log(`Preview Test: Has Student B? ${hasB} (Expected: false)`);

        if (hasA && !hasB) {
                console.log('✅ PREVIEW FILTER SUCCESS');
        } else {
                console.log('❌ PREVIEW FILTER FAILURE');
        }

        // Cleanup (Optional but good)
        await prisma.subjectEnrollment.deleteMany({ where: { subjectOfferingId: offering.id } });
        await prisma.subjectOffering.delete({ where: { id: offering.id } });
        await prisma.subject.delete({ where: { id: subject.id } });
        await prisma.student.deleteMany({ where: { id: { in: [studentA.id, studentB.id] } } });
        console.log('Test records cleaned up.');

    } catch (err) {
            console.error('❌ Test execution failed:', err);
    } finally {
            await prisma.$disconnect();
    }
}

main();
