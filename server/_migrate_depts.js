const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating departments...');

    // Remove Chemical and Electronics
    const toRemove = ['Chemical', 'Electronics'];
    for (const name of toRemove) {
        const dept = await prisma.department.findFirst({ where: { name } });
        if (dept) {
            await prisma.department.delete({ where: { id: dept.id } });
            console.log(`✔ Removed department: ${name}`);
        } else {
            console.log(`⚠ Department not found: ${name}`);
        }
    }

    // Add EXTC, AIDS, MBA
    const toAdd = ['EXTC', 'AIDS', 'MBA'];
    for (const name of toAdd) {
        await prisma.department.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        console.log(`✔ Added department: ${name}`);
    }

    console.log('\n✅ Department update complete!');

    // Print final list
    const all = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    console.log('\nFinal departments:');
    all.forEach(d => console.log(`  - ${d.name}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
