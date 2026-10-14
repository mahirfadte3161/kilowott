import crypto from 'node:crypto';
import { db, run, query } from './db.ts';

export const seedDatabase = (force = false) => {
  // If not forcing, only seed if customers table is empty
  const countRow = query<{ c: number }>('SELECT COUNT(*) as c FROM customers')[0];
  if (!force && countRow && countRow.c > 0) {
    console.log('Database already has records. Skipping default seed.');
    return;
  }

  console.log('Seeding database with realistic WooCommerce CRM demo data...');

  // If force, clear only demo data
  if (force) {
    db.exec(`
      DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE origin = 'demo');
      DELETE FROM communication_activities WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM customer_notes WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM customer_tags WHERE customer_id IN (SELECT id FROM customers WHERE origin = 'demo');
      DELETE FROM orders WHERE origin = 'demo';
      DELETE FROM customers WHERE origin = 'demo';
      DELETE FROM products WHERE origin = 'demo';
    `);
  }

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Seed Products
  const products = [
    {
      id: crypto.randomUUID(),
      wc_product_id: 101,
      name: 'Apex Pro Magnetic RGB Keyboard',
      sku: 'KB-APEX-01',
      price: 199.99,
      regular_price: 219.99,
      sale_price: 199.99,
      stock_quantity: 45,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Electronics', 'Keyboards']),
      description: 'Ultra-fast magnetic switch mechanical keyboard with per-key RGB and OLED smart display.',
      image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 102,
      name: 'ErgoComfort Lumbar Mesh Chair',
      sku: 'CH-ERGO-02',
      price: 349.00,
      regular_price: 399.00,
      sale_price: 349.00,
      stock_quantity: 18,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Furniture', 'Office']),
      description: 'Ergonomic mesh chair with dynamic lumbar response and 4D adjustable armrests.',
      image_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 103,
      name: 'Precision Wireless ANC Studio Headphones',
      sku: 'HP-ANC-03',
      price: 279.50,
      regular_price: 279.50,
      sale_price: null,
      stock_quantity: 32,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Audio', 'Headphones']),
      description: 'Reference-grade wireless active noise-cancelling headphones with 40-hour battery life.',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 104,
      name: 'Thunderbolt 4 Quad-Display Workstation Dock',
      sku: 'DK-TB4-04',
      price: 249.99,
      regular_price: 249.99,
      sale_price: null,
      stock_quantity: 24,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Accessories', 'Docks']),
      description: '14-in-1 high speed dock with 100W PD charging and dual 4K/single 8K output.',
      image_url: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 105,
      name: 'HydroGlaze Top-Grain Leather Desk Mat',
      sku: 'AC-MAT-05',
      price: 65.00,
      regular_price: 75.00,
      sale_price: 65.00,
      stock_quantity: 80,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Accessories', 'Desk']),
      description: 'Handcrafted water-resistant top-grain leather desk pad with wool felt backing.',
      image_url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 106,
      name: 'Broadcast XLR Dynamic Vocal Microphone',
      sku: 'MC-XLR-06',
      price: 189.00,
      regular_price: 189.00,
      sale_price: null,
      stock_quantity: 0,
      stock_status: 'outofstock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Audio', 'Microphones']),
      description: 'Broadcast-quality dynamic cardioid microphone tuned for vocal clarity and speech.',
      image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 107,
      name: 'Modular Gas-Spring Dual Monitor Arm',
      sku: 'AR-GAS-07',
      price: 139.99,
      regular_price: 159.99,
      sale_price: 139.99,
      stock_quantity: 12,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Furniture', 'Mounts']),
      description: 'Heavy-duty dual monitor mount supporting up to 34-inch curved screens.',
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
    },
    {
      id: crypto.randomUUID(),
      wc_product_id: 108,
      name: 'UltraWeave Custom Braided Cable Kit',
      sku: 'CB-WEAVE-08',
      price: 34.50,
      regular_price: 34.50,
      sale_price: null,
      stock_quantity: 110,
      stock_status: 'instock',
      status: 'publish',
      origin: 'demo',
      categories: JSON.stringify(['Accessories', 'Cables']),
      description: 'Detachable aviator coiled USB-C cable kit for custom mechanical keyboards.',
      image_url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&q=80',
    }
  ];

  for (const prod of products) {
    run(`
      INSERT INTO products (id, wc_product_id, name, sku, price, regular_price, sale_price, stock_quantity, stock_status, status, origin, categories, description, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      prod.id, prod.wc_product_id, prod.name, prod.sku, prod.price, prod.regular_price, prod.sale_price,
      prod.stock_quantity, prod.stock_status, prod.status, prod.origin, prod.categories, prod.description,
      prod.image_url, daysAgo(45), daysAgo(5)
    ]);
  }

  // 2. Seed Customers
  const customerSeeds = [
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@techcorp.io',
      phone: '+1 (415) 890-1244',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postcode: '94107',
      address_1: '580 Howard Street, Suite 400',
      registeredDays: 140,
      origin: 'demo',
      tags: ['VIP', 'Repeat Buyer', 'Enterprise'],
      notes: [
        { author: 'Marcus Vance', note: 'Requested corporate tax invoice for Q3 expenses.' },
        { author: 'Sarah Lin', note: 'Interested in bulk workstation order for 20 engineers.' }
      ]
    },
    {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@designcraft.com',
      phone: '+1 (206) 555-0182',
      city: 'Seattle',
      state: 'WA',
      country: 'US',
      postcode: '98101',
      address_1: '1200 4th Ave, Apt 18B',
      registeredDays: 95,
      origin: 'demo',
      tags: ['VIP', 'Audio Enthusiast'],
      notes: [
        { author: 'Alex Rivera', note: 'Inquired about warranty extension on studio headphones.' }
      ]
    },
    {
      firstName: 'Sophie',
      lastName: 'Laurent',
      email: 'sophie.laurent@paris-studio.fr',
      phone: '+33 1 42 68 55 00',
      city: 'Paris',
      state: 'Ile-de-France',
      country: 'FR',
      postcode: '75008',
      address_1: '24 Rue du Faubourg Saint-Honore',
      registeredDays: 70,
      origin: 'demo',
      tags: ['International', 'Design Studio'],
      notes: []
    },
    {
      firstName: 'Marcus',
      lastName: 'Sterling',
      email: 'm.sterling@capitaladvisors.co.uk',
      phone: '+44 20 7946 0912',
      city: 'London',
      state: 'Greater London',
      country: 'GB',
      postcode: 'EC2V 7AY',
      address_1: '100 Cheapside',
      registeredDays: 120,
      origin: 'demo',
      tags: ['High-Value', 'Desk Setup'],
      notes: [
        { author: 'Marcus Vance', note: 'Fast express shipping requested on all orders.' }
      ]
    },
    {
      firstName: 'Aarav',
      lastName: 'Patel',
      email: 'aarav.patel@devcloud.tech',
      phone: '+1 (512) 330-9842',
      city: 'Austin',
      state: 'TX',
      country: 'US',
      postcode: '78701',
      address_1: '300 Colorado St',
      registeredDays: 45,
      origin: 'demo',
      tags: ['Repeat Buyer', 'Developer'],
      notes: []
    },
    {
      firstName: 'Camila',
      lastName: 'Morales',
      email: 'camila.morales@creativeagency.ar',
      phone: '+54 11 4801-2299',
      city: 'Buenos Aires',
      state: 'CABA',
      country: 'AR',
      postcode: 'C1425',
      address_1: 'Av. Libertador 2200',
      registeredDays: 85,
      origin: 'demo',
      tags: ['Inactive > 60d'],
      notes: [
        { author: 'Automated Bot', note: 'Added to 60-day re-engagement drip sequence.' }
      ]
    },
    {
      firstName: 'Lukas',
      lastName: 'Weber',
      email: 'lukas.weber@berlin-tech.de',
      phone: '+49 30 8329 1100',
      city: 'Berlin',
      state: 'Berlin',
      country: 'DE',
      postcode: '10115',
      address_1: 'Friedrichstrasse 176',
      registeredDays: 20,
      origin: 'demo',
      tags: ['New Customer'],
      notes: []
    },
    {
      firstName: 'Hanna',
      lastName: 'Lindqvist',
      email: 'hanna.lindqvist@nordicdesign.se',
      phone: '+46 8 123 4567',
      city: 'Stockholm',
      state: 'Stockholm',
      country: 'SE',
      postcode: '111 22',
      address_1: 'Drottninggatan 45',
      registeredDays: 110,
      origin: 'demo',
      tags: ['Inactive > 90d'],
      notes: []
    }
  ];

  const createdCustomers: any[] = [];

  for (let i = 0; i < customerSeeds.length; i++) {
    const c = customerSeeds[i];
    const customerId = crypto.randomUUID();
    const wcCustId = 1001 + i;
    const emailNorm = c.email.trim().toLowerCase();
    const regAt = daysAgo(c.registeredDays);

    run(`
      INSERT INTO customers (
        id, wc_customer_id, email_normalized, email, first_name, last_name, phone,
        city, state, country, postcode, address_1, address_2, origin, is_guest,
        total_orders, lifetime_spend, registered_at, last_order_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerId, wcCustId, emailNorm, c.email, c.firstName, c.lastName, c.phone,
      c.city, c.state, c.country, c.postcode, c.address_1, null, c.origin, 0,
      0, 0, regAt, null, regAt, regAt
    ]);

    // Add tags
    for (const tag of c.tags) {
      run(`INSERT INTO customer_tags (id, customer_id, tag, created_at) VALUES (?, ?, ?, ?)`, [
        crypto.randomUUID(), customerId, tag, regAt
      ]);
    }

    // Add notes
    for (const n of c.notes) {
      run(`INSERT INTO customer_notes (id, customer_id, author, note, created_at) VALUES (?, ?, ?, ?, ?)`, [
        crypto.randomUUID(), customerId, n.author, n.note, daysAgo(Math.floor(c.registeredDays / 2))
      ]);
    }

    createdCustomers.push({ ...c, id: customerId, wc_customer_id: wcCustId });
  }

  // 3. Seed Orders (24 realistic orders with line items across various statuses)
  const orderConfigs = [
    // Completed orders for Elena Rostova (VIP)
    { custIdx: 0, days: 85, status: 'completed', items: [{ prodIdx: 1, qty: 1 }, { prodIdx: 0, qty: 2 }] },
    { custIdx: 0, days: 30, status: 'completed', items: [{ prodIdx: 3, qty: 1 }, { prodIdx: 4, qty: 2 }] },
    { custIdx: 0, days: 3, status: 'processing', items: [{ prodIdx: 2, qty: 1 }] },
    
    // David Chen
    { custIdx: 1, days: 70, status: 'completed', items: [{ prodIdx: 2, qty: 1 }, { prodIdx: 4, qty: 1 }] },
    { custIdx: 1, days: 12, status: 'completed', items: [{ prodIdx: 0, qty: 1 }, { prodIdx: 7, qty: 2 }] },

    // Sophie Laurent
    { custIdx: 2, days: 50, status: 'completed', items: [{ prodIdx: 1, qty: 1 }, { prodIdx: 6, qty: 1 }] },
    { custIdx: 2, days: 4, status: 'on-hold', items: [{ prodIdx: 3, qty: 1 }] },

    // Marcus Sterling
    { custIdx: 3, days: 90, status: 'completed', items: [{ prodIdx: 1, qty: 2 }, { prodIdx: 3, qty: 1 }] },
    { custIdx: 3, days: 40, status: 'completed', items: [{ prodIdx: 0, qty: 1 }, { prodIdx: 4, qty: 1 }] },
    { custIdx: 3, days: 8, status: 'completed', items: [{ prodIdx: 6, qty: 2 }] },

    // Aarav Patel
    { custIdx: 4, days: 35, status: 'completed', items: [{ prodIdx: 0, qty: 1 }, { prodIdx: 7, qty: 1 }] },
    { custIdx: 4, days: 2, status: 'pending', items: [{ prodIdx: 2, qty: 1 }] },

    // Camila Morales (Inactive >60d)
    { custIdx: 5, days: 75, status: 'completed', items: [{ prodIdx: 0, qty: 1 }] },

    // Lukas Weber (Recent customer)
    { custIdx: 6, days: 15, status: 'completed', items: [{ prodIdx: 4, qty: 1 }, { prodIdx: 7, qty: 1 }] },
    { custIdx: 6, days: 1, status: 'processing', items: [{ prodIdx: 0, qty: 1 }] },

    // Hanna Lindqvist (Inactive >90d)
    { custIdx: 7, days: 105, status: 'completed', items: [{ prodIdx: 2, qty: 1 }] },
    { custIdx: 7, days: 95, status: 'refunded', items: [{ prodIdx: 4, qty: 1 }] },

    // Guest checkouts (No customer account)
    { guestEmail: 'guest.shopper1@gmail.com', guestName: 'Jordan Reed', days: 25, status: 'completed', items: [{ prodIdx: 0, qty: 1 }] },
    { guestEmail: 'buyer.alex@outlook.com', guestName: 'Alex Mercer', days: 18, status: 'completed', items: [{ prodIdx: 4, qty: 2 }] },
    { guestEmail: 'taylor.guest@yahoo.com', guestName: 'Taylor Hayes', days: 6, status: 'cancelled', items: [{ prodIdx: 3, qty: 1 }] },
    { guestEmail: 'sarah.visitor@icloud.com', guestName: 'Sarah Jenkins', days: 1, status: 'pending', items: [{ prodIdx: 1, qty: 1 }] }
  ];

  let orderCounter = 2001;

  for (const cfg of orderConfigs) {
    const orderId = crypto.randomUUID();
    const wcOrderId = orderCounter++;
    const isGuest = 'guestEmail' in cfg;
    const cust = !isGuest ? createdCustomers[cfg.custIdx!] : null;
    const custId = cust ? cust.id : null;
    const custEmail = cust ? cust.email : cfg.guestEmail!;
    const custName = cust ? `${cust.firstName} ${cust.lastName}` : cfg.guestName!;
    const orderDate = daysAgo(cfg.days);

    let subtotal = 0;
    const lineItemsToInsert: any[] = [];

    for (const item of cfg.items) {
      const prod = products[item.prodIdx];
      const itemSub = prod.price * item.qty;
      subtotal += itemSub;
      lineItemsToInsert.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: prod.id,
        wc_product_id: prod.wc_product_id,
        name: prod.name,
        sku: prod.sku,
        quantity: item.qty,
        price: prod.price,
        subtotal: itemSub,
        total: itemSub
      });
    }

    const taxTotal = Math.round(subtotal * 0.08 * 100) / 100;
    const shippingTotal = subtotal > 150 ? 0 : 15.00;
    const discountTotal = subtotal > 300 ? 25.00 : 0;
    const total = Math.max(0, Math.round((subtotal + taxTotal + shippingTotal - discountTotal) * 100) / 100);

    const paymentMethods = ['credit_card', 'paypal', 'apple_pay', 'stripe'];
    const paymentTitles = ['Credit Card (Stripe)', 'PayPal Express', 'Apple Pay', 'Visa / Mastercard'];
    const pIdx = Math.floor(Math.random() * paymentMethods.length);

    run(`
      INSERT INTO orders (
        id, wc_order_id, customer_id, customer_email, customer_name, is_guest,
        status, currency, subtotal, tax_total, shipping_total, discount_total,
        total, payment_method, payment_method_title, shipping_method_title,
        origin, date_created, date_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, wcOrderId, custId, custEmail, custName, isGuest ? 1 : 0,
      cfg.status, 'USD', subtotal, taxTotal, shippingTotal, discountTotal,
      total, paymentMethods[pIdx], paymentTitles[pIdx], shippingTotal === 0 ? 'Free Express Shipping' : 'Standard Ground',
      'demo', orderDate, cfg.status === 'completed' ? daysAgo(Math.max(0, cfg.days - 1)) : null, orderDate, orderDate
    ]);

    for (const li of lineItemsToInsert) {
      run(`
        INSERT INTO order_items (id, order_id, product_id, wc_product_id, name, sku, quantity, price, subtotal, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [li.id, li.order_id, li.product_id, li.wc_product_id, li.name, li.sku, li.quantity, li.price, li.subtotal, li.total]);
    }

    // Update customer stats if linked
    if (custId && cfg.status !== 'cancelled') {
      run(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            lifetime_spend = lifetime_spend + ?,
            last_order_at = CASE WHEN last_order_at IS NULL OR last_order_at < ? THEN ? ELSE last_order_at END,
            updated_at = ?
        WHERE id = ?
      `, [total, orderDate, orderDate, now.toISOString(), custId]);
    }
  }

  // 4. Seed Segments
  const segments = [
    {
      id: crypto.randomUUID(),
      name: 'High-Value Customers',
      description: 'Customers with over $500 in lifetime spending',
      rule_type: 'high_value',
      rule_config_json: JSON.stringify({ min_spend: 500 })
    },
    {
      id: crypto.randomUUID(),
      name: 'Repeat Buyers',
      description: 'Loyal shoppers with 2 or more lifetime orders',
      rule_type: 'repeat',
      rule_config_json: JSON.stringify({ min_orders: 2 })
    },
    {
      id: crypto.randomUUID(),
      name: 'Inactive (60+ Days)',
      description: 'Registered customers who have not placed an order in over 60 days',
      rule_type: 'inactive_60',
      rule_config_json: JSON.stringify({ days_inactive: 60 })
    },
    {
      id: crypto.randomUUID(),
      name: 'Inactive (90+ Days)',
      description: 'Lapsed customers who have had no order activity in over 90 days',
      rule_type: 'inactive_90',
      rule_config_json: JSON.stringify({ days_inactive: 90 })
    },
    {
      id: crypto.randomUUID(),
      name: 'Recent Customers (Last 30 Days)',
      description: 'Customers with purchases within the past 30 days',
      rule_type: 'recent',
      rule_config_json: JSON.stringify({ days: 30 })
    },
    {
      id: crypto.randomUUID(),
      name: 'Customers with Pending Orders',
      description: 'Customers awaiting payment authorization or processing',
      rule_type: 'pending_orders',
      rule_config_json: JSON.stringify({ statuses: ['pending', 'on-hold'] })
    }
  ];

  for (const s of segments) {
    run(`
      INSERT INTO segments (id, name, description, rule_type, rule_config_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [s.id, s.name, s.description, s.rule_type, s.rule_config_json, daysAgo(30), daysAgo(1)]);
  }

  // 5. Seed Campaigns
  const highValSegId = segments[0].id;
  const inactiveSegId = segments[2].id;

  const campaigns = [
    {
      id: crypto.randomUUID(),
      name: 'VIP Private Access — Autumn Hardware Drop',
      subject: 'Exclusive Early Access: Premium Desk Audio & Keyboards',
      channel: 'email',
      target_segment_id: highValSegId,
      template_body: `Hello {{first_name}},\n\nAs one of our most valued patrons, you have unlocked early VIP access to our latest studio hardware release.\n\nEnjoy an exclusive 20% discount using code VIP20 at checkout.\n\nBest regards,\nThe Team`,
      status: 'draft',
      sent_count: 0
    },
    {
      id: crypto.randomUUID(),
      name: 'Win-Back Re-Engagement Campaign',
      subject: 'We miss you! Here is $25 towards your next upgrade',
      channel: 'email',
      target_segment_id: inactiveSegId,
      template_body: `Hi {{first_name}},\n\nIt has been a little while since your last visit. We've introduced several new workspace essentials.\n\nHere is a personal $25 credit on your next order: WELCOMEBACK25.\n\nExplore what's new today!`,
      status: 'draft',
      sent_count: 0
    }
  ];

  for (const cmp of campaigns) {
    run(`
      INSERT INTO campaigns (id, name, subject, channel, target_segment_id, template_body, status, sent_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [cmp.id, cmp.name, cmp.subject, cmp.channel, cmp.target_segment_id, cmp.template_body, cmp.status, cmp.sent_count, daysAgo(10), daysAgo(2)]);
  }

  // 6. Seed Communication Activities
  const commActivities = [
    {
      customer_id: createdCustomers[0].id,
      type: 'email',
      subject: 'Order #2001 Shipped — Tracking #TRK-98214',
      message: 'Your Apex Pro Keyboard order has departed our fulfillment hub.',
      status: 'delivered',
      timestamp: daysAgo(84)
    },
    {
      customer_id: createdCustomers[0].id,
      type: 'reminder',
      subject: 'Follow-up on Enterprise Quote',
      message: 'Send customized volume pricing proposal for 20 ergonomics units.',
      status: 'pending',
      timestamp: daysAgo(1)
    },
    {
      customer_id: createdCustomers[1].id,
      type: 'email',
      subject: 'Order #2004 Confirmation',
      message: 'Thank you for purchasing Precision Wireless ANC Studio Headphones.',
      status: 'delivered',
      timestamp: daysAgo(70)
    },
    {
      customer_id: createdCustomers[4].id,
      type: 'email',
      subject: 'Payment Pending for Order #2012',
      message: 'Awaiting completion of credit card transaction.',
      status: 'sent',
      timestamp: daysAgo(2)
    }
  ];

  for (const ca of commActivities) {
    run(`
      INSERT INTO communication_activities (id, customer_id, campaign_id, type, subject, message, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [crypto.randomUUID(), ca.customer_id, null, ca.type, ca.subject, ca.message, ca.status, ca.timestamp]);
  }

  // 7. Initialize Integration Settings with defaults
  run(`
    INSERT OR IGNORE INTO integration_settings (key, value, updated_at)
    VALUES 
      ('wc_store_url', '', ?),
      ('wc_consumer_key', '', ?),
      ('wc_consumer_secret', '', ?),
      ('wc_webhook_secret', '', ?),
      ('last_sync_at', '', ?),
      ('last_sync_status', 'never_synced', ?),
      ('last_sync_error', '', ?)
  `, [now.toISOString(), now.toISOString(), now.toISOString(), now.toISOString(), now.toISOString(), now.toISOString(), now.toISOString()]);

  console.log('Database seeded successfully with demo records!');
};

// Only execute automatically when directly invoked via CLI
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase(true);
}


