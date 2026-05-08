/**
 * One-off: set a bcrypt password for an existing user (local dev / recovery only).
 * Usage: node scripts/set-dev-password.cjs you@email.com "YourNewPassword8+"
 */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/set-dev-password.cjs "email@example.com" "password"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

async function main() {
  const e = String(email).toLowerCase().trim();
  const user =
    (await prisma.user.findUnique({ where: { email: e } })) ??
    (await prisma.user.findFirst({
      where: { email: { equals: String(email).trim(), mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    }));
  if (!user) {
    console.error(`No user found with email: ${e}`);
    process.exit(1);
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  console.log("Password updated. You can sign in with email + password on /login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
