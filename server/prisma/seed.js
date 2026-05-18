const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const principalEmail = "principal@gmail.com";
  const principalPassword = "principal123"; // change if needed

  // hash password
  const hashedPassword = await bcrypt.hash(principalPassword, 10);

  // check if principal already exists
  const existingPrincipal = await prisma.user.findUnique({
    where: { email: principalEmail }
  });

  if (existingPrincipal) {
    console.log("Principal already exists.");
    return;
  }

  await prisma.user.create({
    data: {
      email: principalEmail,
      password: hashedPassword,
      role: Role.PRINCIPAL
    }
  });

  console.log("Principal user created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });