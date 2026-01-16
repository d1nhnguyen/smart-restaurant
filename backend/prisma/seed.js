const { PrismaClient, MenuStatus, ItemStatus, ModifierSelectionType } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const RESTAURANT_ID = '123e4567-e89b-12d3-a456-426614174000';

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

   console.log('🍽️ Seeding menu categories & items...');

  const categoriesData = [
    { name: 'Appetizers', description: 'Starters & small bites' },
    { name: 'Main Dishes', description: 'Signature main courses' },
    { name: 'Drinks', description: 'Beverages & refreshments' },
    { name: 'Desserts', description: 'Sweet treats' },
    { name: 'Chef Specials', description: 'Chef recommended dishes' },
  ];

  for (const categoryData of categoriesData) {
    // Upsert category: composite unique restaurantId + name
    const category = await prisma.menuCategory.upsert({
      where: {
        restaurantId_name: {
          restaurantId: RESTAURANT_ID,
          name: categoryData.name,
        },
      },
      update: {
        description: categoryData.description,
        status: MenuStatus.ACTIVE,
      },
      create: {
        restaurantId: RESTAURANT_ID,
        name: categoryData.name,
        description: categoryData.description,
        status: MenuStatus.ACTIVE,
      },
    });

    // Để seed chạy lại không bị tạo trùng items:
    // xóa hết items thuộc category này rồi tạo lại 5 món.
    await prisma.menuItem.deleteMany({
      where: {
        restaurantId: RESTAURANT_ID,
        categoryId: category.id,
      },
    });

    for (let i = 1; i <= 5; i++) {
      await prisma.menuItem.create({
        data: {
          restaurantId: RESTAURANT_ID,
          categoryId: category.id,
          name: `${category.name} Item ${i}`,
          description: `Delicious ${category.name.toLowerCase()} item number ${i}`,
          price: Number((Math.random() * 20 + 5).toFixed(2)), // Decimal ok
          prepTimeMinutes: Math.floor(Math.random() * 15) + 5,
          status: ItemStatus.AVAILABLE,
          isChefRecommended: category.name === 'Chef Specials',
          isDeleted: false,
        },
      });
    }

    console.log(`✅ Category "${category.name}" seeded with 5 items`);
  }

  // Create sample modifier groups
  console.log('🔧 Seeding modifier groups & options...');

  // Size modifier group
  const sizeGroup = await prisma.modifierGroup.upsert({
    where: {
      id: '123e4567-0000-4000-a000-000000000001',
    },
    update: {},
    create: {
      id: '123e4567-0000-4000-a000-000000000001',
      restaurantId: RESTAURANT_ID,
      name: 'Size',
      selectionType: 'SINGLE',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      displayOrder: 0,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      { groupId: sizeGroup.id, name: 'Small', priceAdjustment: 0, status: MenuStatus.ACTIVE },
      { groupId: sizeGroup.id, name: 'Medium', priceAdjustment: 1.0, status: MenuStatus.ACTIVE },
      { groupId: sizeGroup.id, name: 'Large', priceAdjustment: 2.0, status: MenuStatus.ACTIVE },
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
      restaurantId: RESTAURANT_ID,
      name: 'Extras',
      selectionType: 'MULTIPLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      displayOrder: 1,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      { groupId: extrasGroup.id, name: 'Extra Cheese', priceAdjustment: 0.5, status: MenuStatus.ACTIVE },
      { groupId: extrasGroup.id, name: 'Bacon', priceAdjustment: 1.0, status: MenuStatus.ACTIVE },
      { groupId: extrasGroup.id, name: 'Avocado', priceAdjustment: 1.5, status: MenuStatus.ACTIVE },
      { groupId: extrasGroup.id, name: 'Mushrooms', priceAdjustment: 0.75, status: MenuStatus.ACTIVE },
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
      restaurantId: RESTAURANT_ID,
      name: 'Spice Level',
      selectionType: 'SINGLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      displayOrder: 2,
      status: MenuStatus.ACTIVE,
    },
  });

  await prisma.modifierOption.createMany({
    data: [
      { groupId: spiceGroup.id, name: 'Mild', priceAdjustment: 0, status: MenuStatus.ACTIVE },
      { groupId: spiceGroup.id, name: 'Medium', priceAdjustment: 0, status: MenuStatus.ACTIVE },
      { groupId: spiceGroup.id, name: 'Hot', priceAdjustment: 0, status: MenuStatus.ACTIVE },
      { groupId: spiceGroup.id, name: 'Extra Hot', priceAdjustment: 0.5, status: MenuStatus.ACTIVE },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created modifier group "Spice Level" with 4 options`);

  // Attach modifiers to menu items
  console.log('🔗 Attaching modifiers to menu items...');
  
  const allItems = await prisma.menuItem.findMany({
    where: { restaurantId: RESTAURANT_ID },
  });

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
