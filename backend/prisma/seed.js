const { PrismaClient, MenuStatus, ItemStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');

  // Delete in correct order to avoid FK constraints
  await prisma.payment.deleteMany({});
  await prisma.orderItemModifier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItemModifierGroup.deleteMany({});
  await prisma.modifierOption.deleteMany({});
  await prisma.modifierGroup.deleteMany({});
  await prisma.menuItemPhoto.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database cleaned successfully');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean database first
  await cleanDatabase();

  // Create default admin user (Simplified: No restaurantId, no Role)
  // Password must meet complexity requirements: 8+ chars, uppercase, lowercase, number
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartrestaurant.com' },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: 'admin@smartrestaurant.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      failedLoginAttempts: 0,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log(`   Password: Admin@123`);

  // Create sample tables (Simplified: No restaurantId)
  const locations = ['Indoor', 'Outdoor', 'Patio', 'VIP Room'];
  const tables = [];

  for (let i = 1; i <= 20; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const capacity = Math.floor(Math.random() * 6) + 2; // 2-8 seats

    // Upsert table with tableNumber
    const table = await prisma.table.upsert({
      where: {
        tableNumber: `T${i.toString().padStart(2, '0')}`,
      },
      update: {},
      create: {
        tableNumber: `T${i.toString().padStart(2, '0')}`,
        capacity: capacity,
        location: location,
        description: `Table ${i} - ${location} section with ${capacity} seats`,
        status: 'AVAILABLE',
      },
    });

    tables.push(table);
  }

  console.log(`✅ Created ${tables.length} sample tables`);

  console.log('🍽️ Seeding menu categories & items...');

  const categoriesData = [
    { name: 'Appetizers', description: 'Starters & small bites' },
    { name: 'Main Dishes', description: 'Signature main courses' },
    { name: 'Drinks', description: 'Beverages & refreshments' },
    { name: 'Desserts', description: 'Sweet treats' },
    { name: 'Chef Specials', description: 'Chef recommended dishes' },
  ];

  for (const categoryData of categoriesData) {
    // Upsert category: unique name
    const category = await prisma.menuCategory.upsert({
      where: {
        name: categoryData.name,
      },
      update: {
        description: categoryData.description,
        status: MenuStatus.ACTIVE,
      },
      create: {
        name: categoryData.name,
        description: categoryData.description,
        status: MenuStatus.ACTIVE,
      },
    });

    // Reset items for this category
    await prisma.menuItem.deleteMany({
      where: {
        categoryId: category.id,
      },
    });

    for (let i = 1; i <= 10; i++) {
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: `${category.name} Item ${i}`,
          description: `Delicious ${category.name.toLowerCase()} item number ${i}`,
          price: Number((Math.random() * 20 + 5).toFixed(2)), // Decimal ok
          prepTimeMinutes: Math.floor(Math.random() * 15) + 5,
          status: ItemStatus.AVAILABLE,
          isChefRecommended: category.name === 'Chef Specials' && i <= 3, // First 3 items of Chef Specials
          isDeleted: false,
        },
      });
    }

    console.log(`✅ Category "${category.name}" seeded with 10 items`);
  }

  // Create sample modifier groups (Simplified: No restaurantId)
  console.log('🔧 Seeding modifier groups & options...');

  // Size modifier group
  const sizeGroup = await prisma.modifierGroup.upsert({
    where: {
      id: '123e4567-0000-4000-a000-000000000001',
    },
    update: {},
    create: {
      id: '123e4567-0000-4000-a000-000000000001',
      name: 'Size',
      selectionType: 'SINGLE',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      displayOrder: 0,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.deleteMany({ where: { groupId: sizeGroup.id } });
  await prisma.modifierOption.createMany({
    data: [
      { groupId: sizeGroup.id, name: 'Small', priceAdjustment: 0, status: MenuStatus.ACTIVE, sortOrder: 0 },
      { groupId: sizeGroup.id, name: 'Medium', priceAdjustment: 1.0, status: MenuStatus.ACTIVE, sortOrder: 1 },
      { groupId: sizeGroup.id, name: 'Large', priceAdjustment: 2.0, status: MenuStatus.ACTIVE, sortOrder: 2 },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created modifier group "Size" with 3 options`);

  // Extras modifier group
  const extrasGroup = await prisma.modifierGroup.upsert({
    where: {
      id: '123e4567-0000-4000-a000-000000000002',
    },
    update: {},
    create: {
      id: '123e4567-0000-4000-a000-000000000002',
      name: 'Extras',
      selectionType: 'MULTIPLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      displayOrder: 1,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.deleteMany({ where: { groupId: extrasGroup.id } });
  await prisma.modifierOption.createMany({
    data: [
      { groupId: extrasGroup.id, name: 'Extra Cheese', priceAdjustment: 0.5, status: MenuStatus.ACTIVE, sortOrder: 0 },
      { groupId: extrasGroup.id, name: 'Bacon', priceAdjustment: 1.0, status: MenuStatus.ACTIVE, sortOrder: 1 },
      { groupId: extrasGroup.id, name: 'Avocado', priceAdjustment: 1.5, status: MenuStatus.ACTIVE, sortOrder: 2 },
      { groupId: extrasGroup.id, name: 'Mushrooms', priceAdjustment: 0.75, status: MenuStatus.ACTIVE, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created modifier group "Extras" with 4 options`);

  // Spice Level modifier group
  const spiceGroup = await prisma.modifierGroup.upsert({
    where: {
      id: '123e4567-0000-4000-a000-000000000003',
    },
    update: {},
    create: {
      id: '123e4567-0000-4000-a000-000000000003',
      name: 'Spice Level',
      selectionType: 'SINGLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      displayOrder: 2,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.deleteMany({ where: { groupId: spiceGroup.id } });
  await prisma.modifierOption.createMany({
    data: [
      { groupId: spiceGroup.id, name: 'Mild', priceAdjustment: 0, status: MenuStatus.ACTIVE, sortOrder: 0 },
      { groupId: spiceGroup.id, name: 'Medium', priceAdjustment: 0, status: MenuStatus.ACTIVE, sortOrder: 1 },
      { groupId: spiceGroup.id, name: 'Hot', priceAdjustment: 0, status: MenuStatus.ACTIVE, sortOrder: 2 },
      { groupId: spiceGroup.id, name: 'Extra Hot', priceAdjustment: 0.5, status: MenuStatus.ACTIVE, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created modifier group "Spice Level" with 4 options`);

  // Attach modifiers to menu items
  // NOTE: Logic remains same, just fetching all Items (no restaurant filter)
  console.log('🔗 Attaching modifiers to menu items...');

  const allItems = await prisma.menuItem.findMany();

  // Attach Size and Extras to all Main Dishes and Appetizers
  const mainAndAppItems = allItems.filter(item =>
    item.name.includes('Main Dishes') || item.name.includes('Appetizers')
  );

  for (const item of mainAndAppItems) {
    await prisma.menuItemModifierGroup.createMany({
      data: [
        { menuItemId: item.id, groupId: sizeGroup.id },
        { menuItemId: item.id, groupId: extrasGroup.id },
      ],
      skipDuplicates: true,
    });
  }

  // Attach Spice Level to Chef Specials
  const chefSpecialItems = allItems.filter(item => item.name.includes('Chef Specials'));

  for (const item of chefSpecialItems) {
    await prisma.menuItemModifierGroup.createMany({
      data: [
        { menuItemId: item.id, groupId: sizeGroup.id },
        { menuItemId: item.id, groupId: spiceGroup.id },
      ],
      skipDuplicates: true,
    });
  }

  // Attach all modifiers to first 3 items for demo
  const demoItems = allItems.slice(0, 3);
  for (const item of demoItems) {
    await prisma.menuItemModifierGroup.createMany({
      data: [
        { menuItemId: item.id, groupId: sizeGroup.id },
        { menuItemId: item.id, groupId: extrasGroup.id },
        { menuItemId: item.id, groupId: spiceGroup.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log(`✅ Attached modifiers to ${allItems.length} menu items`);
  console.log('📝 Seeding sample orders for KDS testing...');

  // Get available data for order creation
  const tablesForOrders = await prisma.table.findMany();
  const allMenuItems = await prisma.menuItem.findMany();

  // Helper function to create past timestamps
  const minutesAgo = (min) => new Date(Date.now() - min * 60000);

  const ordersData = [
    {
      orderNumber: "ORD-KDS-001",
      table: tablesForOrders[0],
      status: 'PREPARING',
      confirmedAt: minutesAgo(5), // 🟢 Green timer (< 10 mins)
      customerName: "Anh Tuấn",
      items: [
        { item: allMenuItems[0], qty: 2 },
        { item: allMenuItems[1], qty: 1 }
      ]
    },
    {
      orderNumber: "ORD-KDS-002",
      table: tablesForOrders[4],
      status: 'PREPARING',
      confirmedAt: minutesAgo(15), // 🟡 Yellow timer (10-20 mins)
      customerName: "Chị Lan",
      items: [
        { item: allMenuItems[2], qty: 3 }
      ]
    },
    {
      orderNumber: "ORD-KDS-003",
      table: tablesForOrders[7],
      status: 'PREPARING',
      confirmedAt: minutesAgo(25), // 🔴 Red timer (> 20 mins)
      customerName: "Bác Hùng",
      items: [
        { item: allMenuItems[3], qty: 1 },
        { item: allMenuItems[4], qty: 2 }
      ]
    },
    {
      orderNumber: "ORD-KDS-004",
      table: tablesForOrders[1],
      status: 'PENDING', // Will not show on KDS
      customerName: "Khách vãng lai",
      items: [{ item: allMenuItems[0], qty: 4 }]
    }
  ];

  for (const o of ordersData) {
    const subtotal = o.items.reduce((sum, i) => sum + (Number(i.item.price) * i.qty), 0);

    await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {},
      create: {
        orderNumber: o.orderNumber,
        tableId: o.table.id,
        orderDate: new Date(),
        status: o.status,
        confirmedAt: o.confirmedAt,
        subtotalAmount: subtotal,
        totalAmount: subtotal,
        customerName: o.customerName,
        items: {
          create: o.items.map(i => ({
            menuItemId: i.item.id,
            menuItemName: i.item.name,
            menuItemPrice: i.item.price,
            quantity: i.qty,
            unitPrice: i.item.price,
            subtotal: Number(i.item.price) * i.qty,
            status: 'PREPARING'
          }))
        }
      }
    });
  }

  console.log(`✅ Created ${ordersData.length} sample orders for KDS`);
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
