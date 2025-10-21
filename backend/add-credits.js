const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCredits() {
  try {
    // Get the first organization (or you can specify a specific organization)
    const orgs = await prisma.organization.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        availableCredits: true,
      }
    });

    if (orgs.length === 0) {
      console.log('No organizations found');
      return;
    }

    console.log('\nFound organizations:');
    orgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (ID: ${org.id}) - Current credits: $${org.availableCredits}`);
    });

    // Add 100,000 credits to all organizations for testing
    for (const org of orgs) {
      const updatedOrg = await prisma.organization.update({
        where: { id: org.id },
        data: {
          availableCredits: {
            increment: 100000
          }
        }
      });

      console.log(`\n✅ Added $100,000 credits to ${org.name}`);
      console.log(`   New balance: $${updatedOrg.availableCredits}`);
    }

    console.log('\n✅ Credits added successfully to all organizations!');
  } catch (error) {
    console.error('Error adding credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();
