import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Smart Canteen...');

  // Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Administrator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@canteen.edu',
      password: hashedPassword,
      name: 'Campus Admin (Prof. Sharma)',
      phone: '+91 98765 00001',
      role: 'ADMIN',
      department: 'Campus Administration',
      roomNumber: 'Admin Wing A-101',
    },
  });
  console.log('✅ Admin user created: admin@canteen.edu');

  // 2. Create 2 Vendors
  const vendorUser1 = await prisma.user.create({
    data: {
      email: 'vendor1@canteen.edu',
      password: hashedPassword,
      name: 'Ramesh Gupta',
      phone: '+91 98765 00002',
      role: 'VENDOR',
      department: 'Main Food Court',
    },
  });

  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      stallName: 'Annapurna South & North Delights',
      description: 'Authentic South Indian breakfast, royal thalis, and fresh tandoor specialties.',
      location: 'Ground Floor, Central Canteen Hall - Counter 1',
      isOpen: true,
      phone: '+91 98765 00002',
      bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: 'vendor2@canteen.edu',
      password: hashedPassword,
      name: 'Kavita Singh',
      phone: '+91 98765 00003',
      role: 'VENDOR',
      department: 'Student Activity Center',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      stallName: 'Cafe Zest & Quick Bites',
      description: 'Artisan coffees, crisp burgers, cheesy pizzas, sandwiches & iced coolers.',
      location: 'First Floor, SAC Atrium - Stall 4',
      isOpen: true,
      phone: '+91 98765 00003',
      bannerImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80',
    },
  });
  console.log('✅ 2 Vendors created: vendor1@canteen.edu & vendor2@canteen.edu');

  // 3. Create 10 Students & Faculty accounts
  const studentsFacultyData = [
    { email: 'student1@canteen.edu', name: 'Aarav Patel', role: 'STUDENT', dept: 'Computer Science', room: 'Hostel Block A-304', phone: '+91 98111 00001' },
    { email: 'student2@canteen.edu', name: 'Ananya Iyer', role: 'STUDENT', dept: 'Electrical Engineering', room: 'Hostel Block C-112', phone: '+91 98111 00002' },
    { email: 'student3@canteen.edu', name: 'Rohan Mehra', role: 'STUDENT', dept: 'Mechanical Engineering', room: 'Hostel Block B-205', phone: '+91 98111 00003' },
    { email: 'student4@canteen.edu', name: 'Pooja Verma', role: 'STUDENT', dept: 'Biotechnology', room: 'Hostel Block D-401', phone: '+91 98111 00004' },
    { email: 'student5@canteen.edu', name: 'Siddharth Rao', role: 'STUDENT', dept: 'Information Technology', room: 'Hostel Block A-118', phone: '+91 98111 00005' },
    { email: 'student6@canteen.edu', name: 'Sneha Deshmukh', role: 'STUDENT', dept: 'Civil Engineering', room: 'Hostel Block C-302', phone: '+91 98111 00006' },
    { email: 'student7@canteen.edu', name: 'Karan Malhotra', role: 'STUDENT', dept: 'Electronics & Comm.', room: 'Hostel Block B-410', phone: '+91 98111 00007' },
    { email: 'student8@canteen.edu', name: 'Diya Sen', role: 'STUDENT', dept: 'Design & Architecture', room: 'Hostel Block D-105', phone: '+91 98111 00008' },
    { email: 'faculty1@canteen.edu', name: 'Dr. Vikram Joshi', role: 'FACULTY', dept: 'Computer Science Faculty', room: 'Faculty Tower 402', phone: '+91 98222 00001' },
    { email: 'faculty2@canteen.edu', name: 'Prof. Meenakshi Sundaram', role: 'FACULTY', dept: 'Mathematics Faculty', room: 'Science Block 215', phone: '+91 98222 00002' },
  ];

  const createdCustomers: any[] = [];
  for (const item of studentsFacultyData) {
    const cust = await prisma.user.create({
      data: {
        email: item.email,
        password: hashedPassword,
        name: item.name,
        phone: item.phone,
        role: item.role,
        department: item.dept,
        roomNumber: item.room,
        cart: {
          create: {},
        },
      },
    });
    createdCustomers.push(cust);
  }
  console.log(`✅ ${createdCustomers.length} Student and Faculty accounts created`);

  // 4. Create Categories
  const categoriesData = [
    { name: 'Breakfast', icon: 'Utensils', displayOrder: 1, description: 'Morning fresh dosas, idlis, parathas & combos', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80' },
    { name: 'Lunch', icon: 'CookingPot', displayOrder: 2, description: 'Hearty thalis, aromatic biryanis & rich curries', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80' },
    { name: 'Snacks', icon: 'Cookie', displayOrder: 3, description: 'Crispy samosas, chaats, burgers & frankies', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
    { name: 'Beverages', icon: 'Coffee', displayOrder: 4, description: 'Hot filter coffee, chai, fresh shakes & coolers', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80' },
    { name: 'Desserts', icon: 'Cake', displayOrder: 5, description: 'Warm gulab jamuns, brownies & ice creams', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({ data: cat });
    catMap[cat.name] = createdCat.id;
  }
  console.log('✅ Categories created');

  // 5. Create Raw Ingredients for Vendor 1 & Vendor 2 (At least 10 ingredients)
  const ingredientsDataV1 = [
    { name: 'Dosa Batter', quantity: 28.5, unit: 'kg', minThreshold: 8.0, costPerUnit: 45.0 },
    { name: 'Paneer (Cottage Cheese)', quantity: 14.0, unit: 'kg', minThreshold: 4.0, costPerUnit: 340.0 },
    { name: 'Basmati Rice', quantity: 45.0, unit: 'kg', minThreshold: 10.0, costPerUnit: 85.0 },
    { name: 'Potatoes (Aloo)', quantity: 32.0, unit: 'kg', minThreshold: 8.0, costPerUnit: 25.0 },
    { name: 'Onions & Tomatoes', quantity: 22.0, unit: 'kg', minThreshold: 6.0, costPerUnit: 35.0 },
    { name: 'Cooking Butter & Ghee', quantity: 3.2, unit: 'kg', minThreshold: 4.0, costPerUnit: 480.0 }, // LOW STOCK!
    { name: 'South Indian Filter Coffee Powder', quantity: 4.5, unit: 'kg', minThreshold: 1.5, costPerUnit: 600.0 },
    { name: 'Fresh Milk', quantity: 18.0, unit: 'liter', minThreshold: 5.0, costPerUnit: 58.0 },
    { name: 'Cooking Oil', quantity: 24.0, unit: 'liter', minThreshold: 6.0, costPerUnit: 140.0 },
    { name: 'Wheat Flour & Maida', quantity: 30.0, unit: 'kg', minThreshold: 8.0, costPerUnit: 40.0 },
  ];

  const ingredientsDataV2 = [
    { name: 'Burger Buns', quantity: 60, unit: 'pcs', minThreshold: 15, costPerUnit: 12.0 },
    { name: 'Veg Patty Mix', quantity: 8.5, unit: 'kg', minThreshold: 3.0, costPerUnit: 220.0 },
    { name: 'Mozzarella Cheese', quantity: 2.1, unit: 'kg', minThreshold: 3.0, costPerUnit: 520.0 }, // LOW STOCK!
    { name: 'Cold Coffee Beans', quantity: 5.0, unit: 'kg', minThreshold: 1.5, costPerUnit: 750.0 },
    { name: 'Pizza Base (8 inch)', quantity: 40, unit: 'pcs', minThreshold: 10, costPerUnit: 22.0 },
    { name: 'Chocolate Syrup', quantity: 6.0, unit: 'liter', minThreshold: 2.0, costPerUnit: 280.0 },
  ];

  const ingMapV1: Record<string, string> = {};
  for (const ing of ingredientsDataV1) {
    const createdIng = await prisma.ingredient.create({
      data: {
        ...ing,
        vendorId: vendor1.id,
        lastRestocked: new Date(),
        transactions: {
          create: {
            type: 'RESTOCK',
            quantity: ing.quantity,
            previousStock: 0,
            newStock: ing.quantity,
            note: 'Initial inventory load',
          },
        },
      },
    });
    ingMapV1[ing.name] = createdIng.id;
  }

  const ingMapV2: Record<string, string> = {};
  for (const ing of ingredientsDataV2) {
    const createdIng = await prisma.ingredient.create({
      data: {
        ...ing,
        vendorId: vendor2.id,
        lastRestocked: new Date(),
        transactions: {
          create: {
            type: 'RESTOCK',
            quantity: ing.quantity,
            previousStock: 0,
            newStock: ing.quantity,
            note: 'Initial inventory load',
          },
        },
      },
    });
    ingMapV2[ing.name] = createdIng.id;
  }
  console.log('✅ Ingredients and stock created');

  // 6. Create at least 20 Food Products across categories with realistic photos & recipes
  const productsData = [
    // Vendor 1 - Breakfast
    {
      vendorId: vendor1.id,
      categoryId: catMap['Breakfast'],
      name: 'Crispy Masala Dosa',
      description: 'Golden fermented rice-lentil crepe stuffed with aromatic spiced potato mash, served with fresh coconut chutney & piping hot sambar.',
      price: 75.0,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      calories: 320,
      badge: 'Bestseller',
      recipe: [
        { ingredientId: ingMapV1['Dosa Batter'], qty: 0.18 },
        { ingredientId: ingMapV1['Potatoes (Aloo)'], qty: 0.12 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.02 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Breakfast'],
      name: 'Steamed Idli & Medu Vada Combo',
      description: 'Two fluffy steamed rice cakes and one crispy golden medu vada, served with traditional lentil sambar and two styles of chutney.',
      price: 65.0,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 8,
      calories: 280,
      badge: "Breakfast Favorite",
      recipe: [
        { ingredientId: ingMapV1['Dosa Batter'], qty: 0.20 },
        { ingredientId: ingMapV1['Cooking Oil'], qty: 0.04 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Breakfast'],
      name: 'Amritsari Aloo Paratha (2 Pcs)',
      description: 'Whole wheat flatbreads stuffed with seasoned spiced potatoes, roasted crisp and brushed with melting fresh white butter. Served with curd and pickle.',
      price: 90.0,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      calories: 450,
      badge: "Chef's Special",
      recipe: [
        { ingredientId: ingMapV1['Wheat Flour & Maida'], qty: 0.2 },
        { ingredientId: ingMapV1['Potatoes (Aloo)'], qty: 0.15 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.03 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Breakfast'],
      name: 'Ghee Podi Thatte Idli',
      description: 'Spongy Karnataka-style platter idli drenched in aromatic desi ghee and fiery gun-powder podi spice.',
      price: 80.0,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      calories: 340,
      badge: 'Popular',
      recipe: [
        { ingredientId: ingMapV1['Dosa Batter'], qty: 0.22 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.03 },
      ],
    },

    // Vendor 1 - Lunch
    {
      vendorId: vendor1.id,
      categoryId: catMap['Lunch'],
      name: 'Royal Shahi Paneer Thali',
      description: 'Creamy rich Shahi Paneer, Dal Makhani, fragrant Jeera Rice, two Butter Naans, salad, crispy papad, and a sweet Gulab Jamun.',
      price: 180.0,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 18,
      calories: 780,
      badge: 'Bestseller',
      recipe: [
        { ingredientId: ingMapV1['Paneer (Cottage Cheese)'], qty: 0.15 },
        { ingredientId: ingMapV1['Basmati Rice'], qty: 0.12 },
        { ingredientId: ingMapV1['Wheat Flour & Maida'], qty: 0.15 },
        { ingredientId: ingMapV1['Onions & Tomatoes'], qty: 0.1 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.03 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Lunch'],
      name: 'Hyderabadi Dum Veg Biryani',
      description: 'Slow-cooked fragrant long-grain Basmati rice layered with marinated garden vegetables, fried onions, and saffron. Served with cooling cucumber raita.',
      price: 140.0,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      calories: 560,
      badge: 'Campus Favorite',
      recipe: [
        { ingredientId: ingMapV1['Basmati Rice'], qty: 0.25 },
        { ingredientId: ingMapV1['Paneer (Cottage Cheese)'], qty: 0.08 },
        { ingredientId: ingMapV1['Onions & Tomatoes'], qty: 0.1 },
        { ingredientId: ingMapV1['Cooking Oil'], qty: 0.03 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Lunch'],
      name: 'Paneer Butter Masala with 2 Garlic Naans',
      description: 'Tender cottage cheese cubes simmered in a velvet tomato butter gravy infused with kasuri methi, paired with smoky garlic naan.',
      price: 160.0,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      calories: 620,
      recipe: [
        { ingredientId: ingMapV1['Paneer (Cottage Cheese)'], qty: 0.18 },
        { ingredientId: ingMapV1['Wheat Flour & Maida'], qty: 0.14 },
        { ingredientId: ingMapV1['Onions & Tomatoes'], qty: 0.12 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.04 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Lunch'],
      name: 'Chole Bhature Platter (2 Pcs)',
      description: 'Puffed golden bhaturas served with spicy authentic Punjabi chickpea masala, sliced pickled onions, and green chillies.',
      price: 110.0,
      imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      calories: 680,
      recipe: [
        { ingredientId: ingMapV1['Wheat Flour & Maida'], qty: 0.22 },
        { ingredientId: ingMapV1['Onions & Tomatoes'], qty: 0.1 },
        { ingredientId: ingMapV1['Cooking Oil'], qty: 0.06 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Lunch'],
      name: 'South Indian Mini Thali',
      description: 'Curd rice, lemon rice, poriyal dry curry, sambar, rasam, appalam, and pickle. Light, nutritious and digestive.',
      price: 95.0,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      calories: 490,
      recipe: [
        { ingredientId: ingMapV1['Basmati Rice'], qty: 0.22 },
        { ingredientId: ingMapV1['Fresh Milk'], qty: 0.15 },
        { ingredientId: ingMapV1['Cooking Oil'], qty: 0.02 },
      ],
    },

    // Vendor 1 - Snacks
    {
      vendorId: vendor1.id,
      categoryId: catMap['Snacks'],
      name: 'Punjabi Samosa Chaat (2 Pcs)',
      description: 'Crushed crispy samosas topped with tangy chole, whipped sweet yoghurt, tamarind chutney, mint sauce, and crunchy nylon sev.',
      price: 60.0,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 8,
      calories: 360,
      badge: 'Hot Seller',
      recipe: [
        { ingredientId: ingMapV1['Potatoes (Aloo)'], qty: 0.15 },
        { ingredientId: ingMapV1['Wheat Flour & Maida'], qty: 0.1 },
        { ingredientId: ingMapV1['Cooking Oil'], qty: 0.03 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Snacks'],
      name: 'Mumbai Style Butter Pav Bhaji',
      description: 'Spicy mashed mixed vegetable curry loaded with melting butter, served with two soft butter-toasted ladi pavs, chopped onions, and lemon.',
      price: 90.0,
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      calories: 520,
      badge: 'Popular',
      recipe: [
        { ingredientId: ingMapV1['Potatoes (Aloo)'], qty: 0.18 },
        { ingredientId: ingMapV1['Onions & Tomatoes'], qty: 0.12 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.04 },
      ],
    },

    // Vendor 1 - Beverages
    {
      vendorId: vendor1.id,
      categoryId: catMap['Beverages'],
      name: 'Degree Filter Coffee',
      description: 'Authentic South Indian chicory blend filter coffee frothed to perfection with steaming full-cream milk.',
      price: 30.0,
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      calories: 120,
      badge: 'Morning Fuel',
      recipe: [
        { ingredientId: ingMapV1['South Indian Filter Coffee Powder'], qty: 0.02 },
        { ingredientId: ingMapV1['Fresh Milk'], qty: 0.15 },
      ],
    },
    {
      vendorId: vendor1.id,
      categoryId: catMap['Beverages'],
      name: 'Kullad Masala Chai',
      description: 'Clay-cup boiled tea infused with crushed ginger, green cardamom, cloves, and fresh mint leaves.',
      price: 25.0,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      calories: 90,
      recipe: [
        { ingredientId: ingMapV1['Fresh Milk'], qty: 0.12 },
      ],
    },

    // Vendor 1 - Desserts
    {
      vendorId: vendor1.id,
      categoryId: catMap['Desserts'],
      name: 'Hot Gulab Jamun (2 Pcs)',
      description: 'Melt-in-mouth milk solid dumplings fried to a golden hue and steeped in saffron-cardamom scented sugar syrup.',
      price: 45.0,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 4,
      calories: 290,
      recipe: [
        { ingredientId: ingMapV1['Fresh Milk'], qty: 0.1 },
        { ingredientId: ingMapV1['Cooking Butter & Ghee'], qty: 0.02 },
      ],
    },

    // Vendor 2 - Snacks & Fast Food
    {
      vendorId: vendor2.id,
      categoryId: catMap['Snacks'],
      name: 'Crispy Veg Supreme Burger',
      description: 'Crisp seasoned vegetable patty nestled in toasted sesame bun with iceberg lettuce, sliced tomatoes, gherkins, and smoked chipotle mayo.',
      price: 85.0,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      calories: 420,
      badge: 'Best Snack',
      recipe: [
        { ingredientId: ingMapV2['Burger Buns'], qty: 1.0 },
        { ingredientId: ingMapV2['Veg Patty Mix'], qty: 0.12 },
      ],
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Snacks'],
      name: 'Cheesy Margherita Pizza (8")',
      description: 'Hand-stretched crisp crust coated with tangy herb tomato sauce, blanketed in 100% dairy mozzarella and fresh basil leaves.',
      price: 150.0,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      calories: 640,
      badge: "Chef's Pick",
      recipe: [
        { ingredientId: ingMapV2['Pizza Base (8 inch)'], qty: 1.0 },
        { ingredientId: ingMapV2['Mozzarella Cheese'], qty: 0.12 },
      ],
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Snacks'],
      name: 'Paneer Tikka Grilled Sandwich',
      description: 'Triple-decker bread stuffed with marinated tandoori paneer, crunchy bell peppers, onions, and melted mozzarella, toasted golden.',
      price: 110.0,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      calories: 480,
      recipe: [
        { ingredientId: ingMapV2['Mozzarella Cheese'], qty: 0.08 },
      ],
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Snacks'],
      name: 'Loaded Peri Peri French Fries',
      description: 'Crispy salted potato fries tossed in spicy peri peri seasonings and drizzled with cheesy jalapeño sauce.',
      price: 75.0,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 8,
      calories: 380,
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Snacks'],
      name: 'Crispy Veg Hakka Noodles',
      description: 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, spring onions, and oriental seasonings.',
      price: 95.0,
      imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      calories: 410,
    },

    // Vendor 2 - Beverages
    {
      vendorId: vendor2.id,
      categoryId: catMap['Beverages'],
      name: 'Signature Thick Cold Coffee',
      description: 'Creamy double-shot espresso blended with chilled milk, vanilla syrup, and finished with chocolate drizzle.',
      price: 70.0,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 6,
      calories: 260,
      badge: 'Youth Hit',
      recipe: [
        { ingredientId: ingMapV2['Cold Coffee Beans'], qty: 0.03 },
        { ingredientId: ingMapV2['Chocolate Syrup'], qty: 0.03 },
      ],
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Beverages'],
      name: 'Fresh Mint Lime Cooler',
      description: 'Zesty sparkling soda with fresh squeezed green lime juice, bruised mint leaves, and black rock salt.',
      price: 45.0,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 4,
      calories: 85,
    },
    {
      vendorId: vendor2.id,
      categoryId: catMap['Desserts'],
      name: 'Warm Chocolate Walnut Brownie',
      description: 'Decadent fudge brownie baked with toasted walnut chunks, served warm with rich chocolate fudge sauce.',
      price: 80.0,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&auto=format&fit=crop&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      calories: 390,
      badge: 'Sweet Treat',
      recipe: [
        { ingredientId: ingMapV2['Chocolate Syrup'], qty: 0.04 },
      ],
    },
  ];

  const createdProducts: any[] = [];
  for (const item of productsData) {
    const { recipe, ...pData } = item;
    const prod = await prisma.product.create({
      data: {
        ...pData,
        ingredients: recipe && recipe.length > 0 ? {
          create: recipe.map((r) => ({
            ingredientId: r.ingredientId,
            quantityRequired: r.qty,
          })),
        } : undefined,
      },
    });
    createdProducts.push(prod);
  }
  console.log(`✅ ${createdProducts.length} Food Products created with recipe linkages`);

  // 7. Create Sample Completed and Pending Orders to demonstrate dashboards immediately
  const sampleOrdersPlan = [
    {
      user: createdCustomers[0], // Aarav Patel
      vendor: vendor1,
      items: [
        { product: createdProducts[0], qty: 2 }, // Masala Dosa
        { product: createdProducts[11], qty: 2 }, // Filter Coffee
      ],
      status: 'COLLECTED',
      paymentMethod: 'UPI',
      notes: 'Please make the dosa extra crisp.',
      daysAgo: 2,
    },
    {
      user: createdCustomers[1], // Ananya Iyer
      vendor: vendor1,
      items: [
        { product: createdProducts[4], qty: 1 }, // Shahi Paneer Thali
      ],
      status: 'COLLECTED',
      paymentMethod: 'CASH',
      notes: 'No spicy onions please.',
      daysAgo: 1,
    },
    {
      user: createdCustomers[2], // Rohan Mehra
      vendor: vendor2,
      items: [
        { product: createdProducts[14], qty: 2 }, // Veg Burger
        { product: createdProducts[19], qty: 2 }, // Cold Coffee
      ],
      status: 'COLLECTED',
      paymentMethod: 'UPI',
      daysAgo: 1,
    },
    {
      user: createdCustomers[3], // Pooja Verma
      vendor: vendor1,
      items: [
        { product: createdProducts[5], qty: 2 }, // Veg Biryani
        { product: createdProducts[13], qty: 2 }, // Gulab Jamun
      ],
      status: 'READY', // Ready for collection right now!
      paymentMethod: 'UPI',
      daysAgo: 0,
    },
    {
      user: createdCustomers[4], // Siddharth Rao
      vendor: vendor1,
      items: [
        { product: createdProducts[0], qty: 1 }, // Masala Dosa
        { product: createdProducts[9], qty: 1 }, // Samosa Chaat
      ],
      status: 'PREPARING', // In kitchen right now!
      paymentMethod: 'UPI',
      daysAgo: 0,
    },
    {
      user: createdCustomers[8], // Dr. Vikram Joshi (Faculty)
      vendor: vendor2,
      items: [
        { product: createdProducts[15], qty: 1 }, // Margherita Pizza
        { product: createdProducts[20], qty: 1 }, // Mint Lime Cooler
      ],
      status: 'PLACED', // Pending vendor acceptance!
      paymentMethod: 'CASH',
      notes: 'Faculty lounge delivery if possible.',
      daysAgo: 0,
    },
  ];

  for (let idx = 0; idx < sampleOrdersPlan.length; idx++) {
    const plan = sampleOrdersPlan[idx];
    const orderNum = `CAN-${9000 + idx}`;
    const subtotal = plan.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const finalAmount = Math.round((subtotal + tax) * 100) / 100;
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - plan.daysAgo);
    orderDate.setHours(orderDate.getHours() - idx);

    await prisma.order.create({
      data: {
        orderNumber: orderNum,
        userId: plan.user.id,
        vendorId: plan.vendor.id,
        status: plan.status,
        totalAmount: subtotal,
        taxAmount: tax,
        finalAmount,
        paymentMethod: plan.paymentMethod,
        paymentStatus: plan.status === 'COLLECTED' || plan.paymentMethod === 'UPI' ? 'COMPLETED' : 'PENDING',
        pickupOtp: (4000 + idx).toString(),
        notes: plan.notes || null,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: plan.items.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            unitPrice: i.product.price,
            quantity: i.qty,
            subtotal: i.product.price * i.qty,
          })),
        },
        payment: {
          create: {
            method: plan.paymentMethod,
            status: plan.status === 'COLLECTED' || plan.paymentMethod === 'UPI' ? 'COMPLETED' : 'PENDING',
            amount: finalAmount,
            transactionId: plan.paymentMethod === 'UPI' ? `UPI-TXN-${80000 + idx}` : null,
            paidAt: plan.status === 'COLLECTED' || plan.paymentMethod === 'UPI' ? orderDate : null,
          },
        },
      },
    });

    // Create a notification for the customer
    await prisma.notification.create({
      data: {
        userId: plan.user.id,
        title: `Order #${orderNum} Status: ${plan.status}`,
        message: `Your order from ${plan.vendor.stallName} is currently ${plan.status}.`,
        type: 'ORDER_STATUS',
      },
    });
  }
  console.log(`✅ Sample orders created across multiple statuses (COLLECTED, READY, PREPARING, PLACED)`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
