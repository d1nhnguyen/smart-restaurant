const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log(`   Password: admin123`);

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
