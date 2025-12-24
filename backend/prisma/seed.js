const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample tables
  const locations = ['Indoor', 'Outdoor', 'Patio', 'VIP Room'];
  const tables = [];

  for (let i = 1; i <= 20; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const capacity = Math.floor(Math.random() * 6) + 2; // 2-8 seats
    
    const table = await prisma.table.upsert({
      where: { tableNumber: `T${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        tableNumber: `T${i.toString().padStart(2, '0')}`,
        capacity: capacity,
        location: location,
        description: `Table ${i} - ${location} section with ${capacity} seats`,
        status: 'ACTIVE',
      },
    });
    
    tables.push(table);
  }

  console.log(`✅ Created ${tables.length} sample tables`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
