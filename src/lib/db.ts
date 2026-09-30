import { neon } from '@neondatabase/serverless';
import { Product, Order, OrderItem, ShippingAddress, UserProfile } from './types';
import { INITIAL_PRODUCTS } from './products-data';

// Helper to check if database URL is configured
export const isNeonConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
};

const getSql = () => {
  if (!isNeonConfigured()) {
    return null;
  }
  return neon(process.env.DATABASE_URL!);
};

// Fallback in-memory store if Neon credentials have not yet been provided
const inMemoryProducts: Product[] = [...INITIAL_PRODUCTS];
const inMemoryOrders: Order[] = [];
const inMemoryUsers: Map<string, UserProfile> = new Map();

/**
 * Initializes database tables in Neon if they don't exist, and seeds initial products
 */
export async function initDb(): Promise<{ success: boolean; message: string; usingFallback?: boolean }> {
  const sql = getSql();
  if (!sql) {
    return {
      success: true,
      message: 'Using in-memory store (DATABASE_URL not set). Provide Neon DATABASE_URL in .env.local for full persistence.',
      usingFallback: true,
    };
  }

  try {
    // 1. Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        rating NUMERIC(3, 2) DEFAULT 5.0,
        reviews_count INT DEFAULT 0,
        image_url TEXT NOT NULL,
        category VARCHAR(64) NOT NULL,
        in_stock BOOLEAN DEFAULT TRUE,
        stock_quantity INT DEFAULT 0,
        features JSONB DEFAULT '[]'::jsonb,
        badge VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        order_number VARCHAR(32) UNIQUE NOT NULL,
        user_id VARCHAR(128),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        shipping_address JSONB NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
        tax NUMERIC(10, 2) DEFAULT 0.00,
        total NUMERIC(10, 2) NOT NULL,
        status VARCHAR(32) DEFAULT 'completed',
        payment_status VARCHAR(32) DEFAULT 'paid',
        mailgun_status VARCHAR(32) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(64) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL,
        quantity INT NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        image_url TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;

    // 2. Check if products exist, seed if empty
    const existing = await sql`SELECT COUNT(*) as count FROM products;`;
    const count = parseInt(existing[0].count, 10);

    if (count === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await sql`
          INSERT INTO products (
            id, name, description, price, rating, reviews_count,
            image_url, category, in_stock, stock_quantity, features, badge
          ) VALUES (
            ${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.rating}, ${p.reviewsCount},
            ${p.imageUrl}, ${p.category}, ${p.inStock}, ${p.stockQuantity}, ${JSON.stringify(p.features)}, ${p.badge || null}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    return { success: true, message: 'Neon PostgreSQL tables initialized and verified successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to initialize Neon database:', errorMsg);
    return { success: false, message: `Database initialization failed: ${errorMsg}` };
  }
}

/**
 * Fetch all products or filter by category & search query
 */
export async function getProducts(category?: string, query?: string): Promise<Product[]> {
  const sql = getSql();
  if (!sql) {
    let result = [...inMemoryProducts];
    if (category && category !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (query && query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return result;
  }

  try {
    let rows;
    if (category && category !== 'All' && query && query.trim()) {
      const searchPattern = `%${query.trim()}%`;
      rows = await sql`
        SELECT * FROM products 
        WHERE LOWER(category) = LOWER(${category}) 
          AND (LOWER(name) LIKE LOWER(${searchPattern}) OR LOWER(description) LIKE LOWER(${searchPattern}))
        ORDER BY created_at ASC;
      `;
    } else if (category && category !== 'All') {
      rows = await sql`
        SELECT * FROM products 
        WHERE LOWER(category) = LOWER(${category})
        ORDER BY created_at ASC;
      `;
    } else if (query && query.trim()) {
      const searchPattern = `%${query.trim()}%`;
      rows = await sql`
        SELECT * FROM products 
        WHERE LOWER(name) LIKE LOWER(${searchPattern}) OR LOWER(description) LIKE LOWER(${searchPattern})
        ORDER BY created_at ASC;
      `;
    } else {
      rows = await sql`SELECT * FROM products ORDER BY created_at ASC;`;
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
      reviewsCount: parseInt(r.reviews_count, 10),
      imageUrl: r.image_url,
      category: r.category,
      inStock: r.in_stock,
      stockQuantity: parseInt(r.stock_quantity, 10),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [],
      badge: r.badge || undefined,
    }));
  } catch (error) {
    console.error('Error fetching products from Neon:', error);
    return inMemoryProducts;
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const sql = getSql();
  if (!sql) {
    return inMemoryProducts.find(p => p.id === id) || null;
  }

  try {
    const rows = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      price: parseFloat(r.price),
      rating: parseFloat(r.rating),
      reviewsCount: parseInt(r.reviews_count, 10),
      imageUrl: r.image_url,
      category: r.category,
      inStock: r.in_stock,
      stockQuantity: parseInt(r.stock_quantity, 10),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [],
      badge: r.badge || undefined,
    };
  } catch (error) {
    console.error(`Error fetching product ${id} from Neon:`, error);
    return inMemoryProducts.find(p => p.id === id) || null;
  }
}

/**
 * Save an order with line items into Neon PostgreSQL
 */
export async function saveOrder(order: Order): Promise<{ success: boolean; orderId: string }> {
  const sql = getSql();
  if (!sql) {
    inMemoryOrders.unshift(order);
    return { success: true, orderId: order.id };
  }

  try {
    // 1. Insert order
    await sql`
      INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email,
        shipping_address, subtotal, shipping_fee, tax, total,
        status, payment_status, mailgun_status, created_at
      ) VALUES (
        ${order.id}, ${order.orderNumber}, ${order.userId || null}, ${order.customerName}, ${order.customerEmail},
        ${JSON.stringify(order.shippingAddress)}, ${order.subtotal}, ${order.shippingFee}, ${order.tax}, ${order.total},
        ${order.status}, ${order.paymentStatus}, ${order.mailgunStatus || 'pending'}, ${order.createdAt}
      );
    `;

    // 2. Insert order items
    for (const item of order.items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, unit_price, quantity, total_price, image_url
        ) VALUES (
          ${order.id}, ${item.productId}, ${item.productName}, ${item.unitPrice}, ${item.quantity}, ${item.totalPrice}, ${item.imageUrl || null}
        );
      `;

      // 3. Decrement stock quantity
      await sql`
        UPDATE products 
        SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity})
        WHERE id = ${item.productId};
      `;
    }

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Error saving order to Neon:', error);
    // Fallback store so customer flow is never lost
    inMemoryOrders.unshift(order);
    return { success: true, orderId: order.id };
  }
}

/**
 * Update Mailgun delivery status on an order
 */
export async function updateOrderMailgunStatus(orderId: string, status: 'sent' | 'simulated' | 'failed') {
  const sql = getSql();
  if (!sql) {
    const found = inMemoryOrders.find(o => o.id === orderId);
    if (found) found.mailgunStatus = status;
    return;
  }

  try {
    await sql`
      UPDATE orders 
      SET mailgun_status = ${status} 
      WHERE id = ${orderId};
    `;
  } catch (error) {
    console.error(`Failed to update mailgun status for order ${orderId}:`, error);
  }
}

/**
 * Fetch order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const sql = getSql();
  if (!sql) {
    return inMemoryOrders.find(o => o.id === id) || null;
  }

  try {
    const orderRows = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1;`;
    if (orderRows.length === 0) return null;
    const r = orderRows[0];

    const itemsRows = await sql`SELECT * FROM order_items WHERE order_id = ${id};`;
    const items: OrderItem[] = itemsRows.map((it: any) => ({
      id: String(it.id),
      orderId: it.order_id,
      productId: it.product_id,
      productName: it.product_name,
      unitPrice: parseFloat(it.unit_price),
      quantity: parseInt(it.quantity, 10),
      totalPrice: parseFloat(it.total_price),
      imageUrl: it.image_url || undefined,
    }));

    return {
      id: r.id,
      orderNumber: r.order_number,
      userId: r.user_id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      shippingAddress: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
      items,
      subtotal: parseFloat(r.subtotal),
      shippingFee: parseFloat(r.shipping_fee),
      tax: parseFloat(r.tax),
      total: parseFloat(r.total),
      status: r.status,
      paymentStatus: r.payment_status,
      mailgunStatus: r.mailgun_status,
      createdAt: r.created_at,
    };
  } catch (error) {
    console.error(`Error fetching order ${id} from Neon:`, error);
    return inMemoryOrders.find(o => o.id === id) || null;
  }
}

/**
 * Fetch orders optionally filtered by user email
 */
export async function getOrders(userEmail?: string): Promise<Order[]> {
  const sql = getSql();
  if (!sql) {
    if (userEmail) {
      return inMemoryOrders.filter(o => o.customerEmail.toLowerCase() === userEmail.toLowerCase());
    }
    return inMemoryOrders;
  }

  try {
    let orderRows;
    if (userEmail) {
      orderRows = await sql`
        SELECT * FROM orders 
        WHERE LOWER(customer_email) = LOWER(${userEmail})
        ORDER BY created_at DESC 
        LIMIT 20;
      `;
    } else {
      orderRows = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;`;
    }

    const orders: Order[] = [];
    for (const r of orderRows) {
      const itemsRows = await sql`SELECT * FROM order_items WHERE order_id = ${r.id};`;
      const items: OrderItem[] = itemsRows.map((it: any) => ({
        id: String(it.id),
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        unitPrice: parseFloat(it.unit_price),
        quantity: parseInt(it.quantity, 10),
        totalPrice: parseFloat(it.total_price),
        imageUrl: it.image_url || undefined,
      }));

      orders.push({
        id: r.id,
        orderNumber: r.order_number,
        userId: r.user_id,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        shippingAddress: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
        items,
        subtotal: parseFloat(r.subtotal),
        shippingFee: parseFloat(r.shipping_fee),
        tax: parseFloat(r.tax),
        total: parseFloat(r.total),
        status: r.status,
        paymentStatus: r.payment_status,
        mailgunStatus: r.mailgun_status,
        createdAt: r.created_at,
      });
    }

    return orders;
  } catch (error) {
    console.error('Error fetching orders from Neon:', error);
    return inMemoryOrders;
  }
}

/**
 * Sync user profile upon Google OAuth login
 */
export async function syncUserProfile(user: {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<UserProfile | null> {
  if (!user.email) return null;

  const id = user.id || `google_${user.email}`;
  const email = user.email;
  const name = user.name || '';
  const image = user.image || '';

  const sql = getSql();
  if (!sql) {
    const profile: UserProfile = {
      id,
      email,
      name,
      image,
      lastLoginAt: new Date().toISOString(),
    };
    inMemoryUsers.set(email, profile);
    return profile;
  }

  try {
    const rows = await sql`
      INSERT INTO users (id, email, name, image, last_login_at)
      VALUES (${id}, ${email}, ${name}, ${image}, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        last_login_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    };
  } catch (error) {
    console.error('Error syncing user profile to Neon:', error);
    return null;
  }
}

/**
 * Get user profile by email
 */
export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const sql = getSql();
  if (!sql) {
    return inMemoryUsers.get(email) || null;
  }

  try {
    const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    };
  } catch (error) {
    console.error(`Error fetching user profile for ${email}:`, error);
    return null;
  }
}

