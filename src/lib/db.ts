import { neon } from '@neondatabase/serverless';
import { Product, Order, OrderItem, ShippingAddress, UserProfile, UserRecord, CartItem } from './types';
import { INITIAL_PRODUCTS } from './products-data';
import { hashPassword, verifyPassword, generateSecureToken, generateVerificationCode } from './crypto';

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
const inMemoryUsers: Map<string, UserRecord> = new Map();
const inMemoryCarts: Map<string, { productId: string; quantity: number }[]> = new Map();

// Seed initial demo users in in-memory fallback
const demoShopperHash = hashPassword('Demo1234!');
inMemoryUsers.set('demo.shopper@techhaven.com', {
  id: 'user_demo_shopper',
  email: 'demo.shopper@techhaven.com',
  name: 'Demo Shopper',
  image: null,
  emailVerified: true,
  passwordHash: demoShopperHash,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
});

const aliceHash = hashPassword('Alice1234!');
inMemoryUsers.set('alice.tech@gmail.com', {
  id: 'user_alice_tech',
  email: 'alice.tech@gmail.com',
  name: 'Alice Tech',
  image: null,
  emailVerified: true,
  passwordHash: aliceHash,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
});


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
        resend_status VARCHAR(32) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Ensure migration from mailgun_status to resend_status if existing
    await sql`
      DO $$ 
      BEGIN 
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='mailgun_status'
        ) THEN
          ALTER TABLE orders RENAME COLUMN mailgun_status TO resend_status;
        ELSE
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS resend_status VARCHAR(32) DEFAULT 'pending';
        END IF;
      END $$;
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
        password_hash VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP WITH TIME ZONE,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Ensure all auth columns exist on existing databases
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;`;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;


    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);`;

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
    throw new Error(error instanceof Error ? error.message : 'Database query failed');
  }
}

/**
 * Fetch distinct product categories from the database
 */
export async function getCategories(): Promise<string[]> {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not configured');
  }

  try {
    const rows = await sql`SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC;`;
    return ['All', ...rows.map((r: any) => r.category)];
  } catch (error) {
    console.error('Error fetching categories from Neon:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to load categories');
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
        status, payment_status, resend_status, created_at
      ) VALUES (
        ${order.id}, ${order.orderNumber}, ${order.userId || null}, ${order.customerName}, ${order.customerEmail},
        ${JSON.stringify(order.shippingAddress)}, ${order.subtotal}, ${order.shippingFee}, ${order.tax}, ${order.total},
        ${order.status}, ${order.paymentStatus}, ${order.resendStatus || 'pending'}, ${order.createdAt}
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
 * Update Resend delivery status on an order
 */
export async function updateOrderResendStatus(orderId: string, status: 'sent' | 'simulated' | 'failed') {
  const sql = getSql();
  if (!sql) {
    const found = inMemoryOrders.find(o => o.id === orderId);
    if (found) found.resendStatus = status;
    return;
  }

  try {
    await sql`
      UPDATE orders 
      SET resend_status = ${status} 
      WHERE id = ${orderId};
    `;
  } catch (error) {
    console.error(`Failed to update resend status for order ${orderId}:`, error);
  }
}

export const updateOrderMailgunStatus = updateOrderResendStatus;


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
      resendStatus: r.resend_status || r.mailgun_status || 'pending',
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
        resendStatus: r.resend_status || r.mailgun_status || 'pending',
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
  const cleanEmail = email.trim().toLowerCase();
  const sql = getSql();
  if (!sql) {
    const mem = inMemoryUsers.get(cleanEmail);
    if (!mem) return null;
    return {
      id: mem.id,
      email: mem.email,
      name: mem.name,
      image: mem.image,
      emailVerified: mem.emailVerified,
      createdAt: mem.createdAt,
      lastLoginAt: mem.lastLoginAt,
    };
  }

  try {
    const rows = await sql`SELECT * FROM users WHERE email = ${cleanEmail} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      emailVerified: Boolean(r.email_verified),
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    };
  } catch (error) {
    console.error(`Error fetching user profile for ${email}:`, error);
    return null;
  }
}

/**
 * Get full user record including security hashes and tokens
 */
export async function getFullUserByEmail(email: string): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  const sql = getSql();
  if (!sql) {
    return inMemoryUsers.get(cleanEmail) || null;
  }

  try {
    const rows = await sql`SELECT * FROM users WHERE email = ${cleanEmail} LIMIT 1;`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      passwordHash: r.password_hash,
      emailVerified: Boolean(r.email_verified),
      verificationToken: r.verification_token,
      verificationTokenExpires: r.verification_token_expires,
      resetToken: r.reset_token,
      resetTokenExpires: r.reset_token_expires,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    };
  } catch (error) {
    console.error(`Error fetching full user for ${email}:`, error);
    return inMemoryUsers.get(cleanEmail) || null;
  }
}

/**
 * Register a new user with password and generate email verification credentials
 */
export async function registerUser({
  email,
  password,
  name,
}: {
  email: string;
  password?: string;
  name?: string;
}): Promise<{
  success: boolean;
  user?: UserProfile;
  token?: string;
  code?: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  const existing = await getFullUserByEmail(cleanEmail);
  if (existing && existing.passwordHash) {
    return {
      success: false,
      error: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const userId = existing?.id || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const userName = (name ? name.trim() : null) || existing?.name || cleanEmail.split('@')[0];
  const passwordHash = password ? hashPassword(password) : existing?.passwordHash || null;
  const token = generateSecureToken();
  const code = generateVerificationCode();
  const verificationCombined = `${code}:${token}`;
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const sql = getSql();
  if (!sql) {
    const record: UserRecord = {
      id: userId,
      email: cleanEmail,
      name: userName,
      image: existing?.image || null,
      passwordHash,
      emailVerified: false,
      verificationToken: verificationCombined,
      verificationTokenExpires: verificationExpires,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    inMemoryUsers.set(cleanEmail, record);

    return {
      success: true,
      user: {
        id: record.id,
        email: record.email,
        name: record.name,
        image: record.image,
        emailVerified: false,
        createdAt: record.createdAt,
        lastLoginAt: record.lastLoginAt,
      },
      token,
      code,
    };
  }

  try {
    const rows = await sql`
      INSERT INTO users (
        id, email, name, password_hash, email_verified,
        verification_token, verification_token_expires, last_login_at
      ) VALUES (
        ${userId}, ${cleanEmail}, ${userName}, ${passwordHash}, FALSE,
        ${verificationCombined}, ${verificationExpires}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
        verification_token = EXCLUDED.verification_token,
        verification_token_expires = EXCLUDED.verification_token_expires,
        last_login_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const r = rows[0];
    const profile: UserProfile = {
      id: r.id,
      email: r.email,
      name: r.name,
      image: r.image,
      emailVerified: Boolean(r.email_verified),
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    };

    return {
      success: true,
      user: profile,
      token,
      code,
    };
  } catch (error: any) {
    console.error('Error registering user in Neon:', error);
    return { success: false, error: error.message || 'Database registration failed.' };
  }
}

/**
 * Verify user password credentials
 */
export async function verifyUserCredentials(
  email: string,
  password?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const record = await getFullUserByEmail(cleanEmail);

  if (!record) {
    return { success: false, error: 'No account found with this email. Please sign up.' };
  }

  if (password) {
    if (!record.passwordHash) {
      return {
        success: false,
        error: 'This account was signed in via Google or 1-Click login. Please sign in with Google or reset your password.',
      };
    }

    const isValid = verifyPassword(password, record.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
  }

  const profile: UserProfile = {
    id: record.id,
    email: record.email,
    name: record.name,
    image: record.image,
    emailVerified: record.emailVerified,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
  };

  return { success: true, user: profile };
}

/**
 * Generate a fresh email verification token and code
 */
export async function generateVerificationToken(
  email: string
): Promise<{ token: string; code: string; user: UserProfile } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const record = await getFullUserByEmail(cleanEmail);
  if (!record) return null;

  const token = generateSecureToken();
  const code = generateVerificationCode();
  const combined = `${code}:${token}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const sql = getSql();
  if (!sql) {
    record.verificationToken = combined;
    record.verificationTokenExpires = expires;
    inMemoryUsers.set(cleanEmail, record);
    return { token, code, user: record };
  }

  try {
    await sql`
      UPDATE users 
      SET verification_token = ${combined}, verification_token_expires = ${expires}
      WHERE email = ${cleanEmail};
    `;
    return { token, code, user: record };
  } catch (error) {
    console.error('Failed to update verification token in Neon:', error);
    return null;
  }
}

/**
 * Verify an email address via token or 6-digit confirmation code
 */
export async function verifyEmailToken(
  tokenOrCode: string
): Promise<{ success: boolean; user?: UserProfile; alreadyVerified?: boolean; error?: string }> {
  const clean = tokenOrCode.trim();
  if (!clean) {
    return { success: false, error: 'Verification token or code is required.' };
  }

  const sql = getSql();
  if (!sql) {
    for (const [email, user] of inMemoryUsers.entries()) {
      if (
        user.verificationToken &&
        (user.verificationToken === clean || user.verificationToken.includes(clean))
      ) {
        if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
          return { success: false, error: 'Verification code has expired. Please request a new one.' };
        }
        user.emailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        inMemoryUsers.set(email, user);
        return { success: true, user };
      }
    }
    return { success: false, error: 'Invalid or expired verification code.' };
  }

  try {
    const searchPattern = `%${clean}%`;
    const rows = await sql`
      SELECT * FROM users 
      WHERE verification_token LIKE ${searchPattern}
        AND verification_token_expires > CURRENT_TIMESTAMP
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return { success: false, error: 'Invalid or expired verification code. Please request a new code.' };
    }

    const r = rows[0];
    await sql`
      UPDATE users 
      SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
      WHERE id = ${r.id};
    `;

    return {
      success: true,
      user: {
        id: r.id,
        email: r.email,
        name: r.name,
        image: r.image,
        emailVerified: true,
        createdAt: r.created_at,
        lastLoginAt: r.last_login_at,
      },
    };
  } catch (error: any) {
    console.error('Error verifying email token in Neon:', error);
    return { success: false, error: error.message || 'Verification failed.' };
  }
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(
  email: string
): Promise<{ token: string; user: UserProfile } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const record = await getFullUserByEmail(cleanEmail);
  if (!record) return null;

  const token = generateSecureToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const sql = getSql();
  if (!sql) {
    record.resetToken = token;
    record.resetTokenExpires = expires;
    inMemoryUsers.set(cleanEmail, record);
    return { token, user: record };
  }

  try {
    await sql`
      UPDATE users 
      SET reset_token = ${token}, reset_token_expires = ${expires}
      WHERE email = ${cleanEmail};
    `;
    return { token, user: record };
  } catch (error) {
    console.error('Failed to update password reset token in Neon:', error);
    return null;
  }
}

/**
 * Reset password using single-use reset token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: 'Reset token is missing or invalid.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const passwordHash = hashPassword(newPassword);

  const sql = getSql();
  if (!sql) {
    for (const [email, user] of inMemoryUsers.entries()) {
      if (user.resetToken === cleanToken) {
        if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
          return { success: false, error: 'Password reset link has expired. Please request a new one.' };
        }
        user.passwordHash = passwordHash;
        user.resetToken = null;
        user.resetTokenExpires = null;
        user.emailVerified = true;
        inMemoryUsers.set(email, user);
        return { success: true, user };
      }
    }
    return { success: false, error: 'Invalid or expired password reset link.' };
  }

  try {
    const rows = await sql`
      SELECT * FROM users 
      WHERE reset_token = ${cleanToken} 
        AND reset_token_expires > CURRENT_TIMESTAMP
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return { success: false, error: 'Password reset link is invalid or has expired.' };
    }

    const r = rows[0];
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL, email_verified = TRUE
      WHERE id = ${r.id};
    `;

    return {
      success: true,
      user: {
        id: r.id,
        email: r.email,
        name: r.name,
        image: r.image,
        emailVerified: true,
        createdAt: r.created_at,
        lastLoginAt: r.last_login_at,
      },
    };
  } catch (error: any) {
    console.error('Error resetting password in Neon:', error);
    return { success: false, error: error.message || 'Password reset failed.' };
  }
}


/**
 * Helper to format raw product row into Product object
 */
function formatProductRow(r: any): Product {
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
}

// Write-through cart cache to enable instant (<10ms) real-time cart synchronization
const cartCache: Map<string, CartItem[]> = new Map();

/**
 * Fetch cart items for a user
 */
export async function getCartDb(userId: string): Promise<CartItem[]> {
  if (!userId) return [];
  if (cartCache.has(userId)) {
    return cartCache.get(userId)!;
  }

  const sql = getSql();
  if (!sql) {
    const userCart = inMemoryCarts.get(userId) || [];
    const items: CartItem[] = [];
    for (const item of userCart) {
      const prod = inMemoryProducts.find((p) => p.id === item.productId);
      if (prod) {
        items.push({ product: prod, quantity: item.quantity });
      }
    }
    cartCache.set(userId, items);
    return items;
  }

  try {
    const rows = await sql`
      SELECT 
        c.quantity, 
        p.id, p.name, p.description, p.price, p.rating, p.reviews_count, 
        p.image_url, p.category, p.in_stock, p.stock_quantity, p.features, p.badge
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at ASC;
    `;

    const items = rows.map((r: any) => ({
      product: formatProductRow(r),
      quantity: parseInt(r.quantity, 10),
    }));
    cartCache.set(userId, items);
    return items;
  } catch (error) {
    console.error(`Error fetching cart for user ${userId}:`, error);
    const userCart = inMemoryCarts.get(userId) || [];
    const items = userCart
      .map((item) => {
        const prod = inMemoryProducts.find((p) => p.id === item.productId);
        return prod ? { product: prod, quantity: item.quantity } : null;
      })
      .filter(Boolean) as CartItem[];
    cartCache.set(userId, items);
    return items;
  }
}

/**
 * Add or increment item in cart
 */
export async function addToCartDb(userId: string, productId: string, quantity = 1): Promise<CartItem[]> {
  if (!userId || !productId) return [];

  // Ensure user cart is initialized in cache without blocking on remote SQL
  const current = cartCache.get(userId) ? [...cartCache.get(userId)!] : [];
  const existingIdx = current.findIndex((item) => item.product.id === productId);

  if (existingIdx >= 0) {
    current[existingIdx] = {
      ...current[existingIdx],
      quantity: current[existingIdx].quantity + quantity,
    };
  } else {
    const product = inMemoryProducts.find((p) => p.id === productId) || (await getProductById(productId));
    if (product) {
      current.push({ product, quantity });
    }
  }

  cartCache.set(userId, current);

  // Synchronously update inMemoryCarts fallback
  const inMem = inMemoryCarts.get(userId) || [];
  const inMemIdx = inMem.findIndex((it) => it.productId === productId);
  if (inMemIdx >= 0) {
    inMem[inMemIdx].quantity += quantity;
  } else {
    inMem.push({ productId, quantity });
  }
  inMemoryCarts.set(userId, inMem);

  // Persist to Neon PostgreSQL asynchronously
  const sql = getSql();
  if (sql) {
    sql`
      INSERT INTO cart_items (user_id, product_id, quantity, updated_at)
      VALUES (${userId}, ${productId}, ${quantity}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET 
        quantity = cart_items.quantity + ${quantity},
        updated_at = CURRENT_TIMESTAMP;
    `.catch((error) => {
      console.error(`Background error adding to cart in Neon for user ${userId}:`, error);
    });
  }

  return current;
}

/**
 * Update quantity for item in cart
 */
export async function updateCartItemQuantityDb(userId: string, productId: string, quantity: number): Promise<CartItem[]> {
  if (!userId || !productId) return [];
  if (quantity <= 0) {
    return removeFromCartDb(userId, productId);
  }

  const current = cartCache.get(userId) ? [...cartCache.get(userId)!] : [];
  const existingIdx = current.findIndex((item) => item.product.id === productId);

  if (existingIdx >= 0) {
    current[existingIdx] = {
      ...current[existingIdx],
      quantity,
    };
    cartCache.set(userId, current);
  }

  const inMem = inMemoryCarts.get(userId) || [];
  const inMemIdx = inMem.findIndex((it) => it.productId === productId);
  if (inMemIdx >= 0) {
    inMem[inMemIdx].quantity = quantity;
    inMemoryCarts.set(userId, inMem);
  }

  const sql = getSql();
  if (sql) {
    sql`
      UPDATE cart_items 
      SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND product_id = ${productId};
    `.catch((error) => {
      console.error(`Background error updating cart quantity in Neon for user ${userId}:`, error);
    });
  }

  return current;
}

/**
 * Remove an item from cart
 */
export async function removeFromCartDb(userId: string, productId: string): Promise<CartItem[]> {
  if (!userId || !productId) return [];

  const current = cartCache.get(userId) ? [...cartCache.get(userId)!] : [];
  const updated = current.filter((item) => item.product.id !== productId);
  cartCache.set(userId, updated);

  const inMem = inMemoryCarts.get(userId) || [];
  inMemoryCarts.set(userId, inMem.filter((it) => it.productId !== productId));

  const sql = getSql();
  if (sql) {
    sql`
      DELETE FROM cart_items 
      WHERE user_id = ${userId} AND product_id = ${productId};
    `.catch((error) => {
      console.error(`Background error removing item from cart in Neon for user ${userId}:`, error);
    });
  }

  return updated;
}

/**
 * Clear all items in cart
 */
export async function clearCartDb(userId: string): Promise<void> {
  if (!userId) return;

  cartCache.set(userId, []);
  inMemoryCarts.delete(userId);

  const sql = getSql();
  if (sql) {
    sql`DELETE FROM cart_items WHERE user_id = ${userId};`.catch((error) => {
      console.error(`Background error clearing cart in Neon for user ${userId}:`, error);
    });
  }
}



