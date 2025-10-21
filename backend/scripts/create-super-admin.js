const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createSuperAdmin() {
  try {
    console.log('\n=== Create Super Admin ===\n');

    // Get email from user
    const email = await question('Enter the email of the user to promote to super admin: ');

    if (!email) {
      console.log('Email is required');
      process.exit(1);
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: email.trim() },
      include: { organization: true },
    });

    if (!user) {
      console.log(`\nUser with email "${email}" not found.`);
      process.exit(1);
    }

    console.log('\nFound user:');
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current Role: ${user.role}`);
    console.log(`  Organization: ${user.organization.name}`);

    if (user.role === 'super_admin') {
      console.log('\nThis user is already a super admin!');
      process.exit(0);
    }

    const confirm = await question('\nPromote this user to super admin? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'super_admin' },
    });

    console.log('\n✅ Success! User has been promoted to super admin.');
    console.log(`\nYou can now login as ${updatedUser.email} to access super admin features.`);
    console.log('Super admin dashboard: http://localhost:3000/super-admin\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createSuperAdmin();
