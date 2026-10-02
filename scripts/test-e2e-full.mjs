import http from 'http';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `e2e_verify_${Date.now()}@techhaven.shop`;
const TEST_USER_ID = `user_${Date.now()}`;

const results = [];

function recordResult(testName, passed, details = {}) {
  results.push({
    testName,
    status: passed ? 'PASS' : 'FAIL',
    details,
  });
  console.log(`[${passed ? 'PASS ✅' : 'FAIL ❌'}] ${testName}`);
  if (Object.keys(details).length > 0) {
    console.log(`       Details:`, JSON.stringify(details));
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 TECHHAVEN SHOP - COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Test 1: GET /api/seed
  try {
    const res = await fetch(`${BASE_URL}/api/seed`);
    const data = await res.json();
    const passed = res.status === 200 && data.success === true;
    recordResult('GET /api/seed (Database & Seed Verification)', passed, {
      status: res.status,
      neonConfigured: data.neonConfigured,
      message: data.message,
    });
  } catch (err) {
    recordResult('GET /api/seed (Database & Seed Verification)', false, { error: err.message });
  }

  // Test 2: GET /api/products
  let testProductId = 'prod-1';
  let testProduct = null;
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && Array.isArray(data.products) && data.products.length > 0;
    if (passed) {
      testProduct = data.products[0];
      testProductId = testProduct.id;
    }
    recordResult('GET /api/products (Product Catalog Retrieval)', passed, {
      status: res.status,
      productCount: data.products?.length,
      sampleProduct: testProduct?.name,
    });
  } catch (err) {
    recordResult('GET /api/products (Product Catalog Retrieval)', false, { error: err.message });
  }

  // Test 3: POST /api/auth/mobile
  let mobileToken = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        name: 'E2E Verified Tester',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.token && data.user?.email === TEST_EMAIL;
    if (passed) {
      mobileToken = data.token;
    }
    recordResult('POST /api/auth/mobile (Mobile OAuth & Account Sync)', passed, {
      status: res.status,
      userId: data.user?.id,
      email: data.user?.email,
      tokenReturned: !!data.token,
    });
  } catch (err) {
    recordResult('POST /api/auth/mobile (Mobile OAuth & Account Sync)', false, { error: err.message });
  }

  const activeUserId = mobileToken || TEST_USER_ID;

  // Test 4: POST /api/cart - Add Item
  try {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        productId: testProductId,
        quantity: 2,
        action: 'add',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.items?.some((i) => i.product.id === testProductId && i.quantity === 2);
    recordResult('POST /api/cart (Add Item to Cart)', passed, {
      status: res.status,
      itemCount: data.items?.length,
      itemQuantity: data.items?.[0]?.quantity,
    });
  } catch (err) {
    recordResult('POST /api/cart (Add Item to Cart)', false, { error: err.message });
  }

  // Test 5: GET /api/cart?userId=...
  try {
    const res = await fetch(`${BASE_URL}/api/cart?userId=${activeUserId}`);
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.items?.length > 0;
    recordResult('GET /api/cart?userId=... (Persisted Cart Retrieval)', passed, {
      status: res.status,
      persistedItemCount: data.items?.length,
      firstProduct: data.items?.[0]?.product?.name,
    });
  } catch (err) {
    recordResult('GET /api/cart?userId=... (Persisted Cart Retrieval)', false, { error: err.message });
  }

  // Test 6: POST /api/cart - Update Quantity
  try {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        productId: testProductId,
        quantity: 4,
        action: 'update',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.items?.some((i) => i.product.id === testProductId && i.quantity === 4);
    recordResult('POST /api/cart (Update Item Quantity)', passed, {
      status: res.status,
      updatedQuantity: data.items?.[0]?.quantity,
    });
  } catch (err) {
    recordResult('POST /api/cart (Update Item Quantity)', false, { error: err.message });
  }

  // Test 7: POST /api/cart - Remove Item
  try {
    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        productId: testProductId,
        action: 'remove',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && (data.items?.length === 0 || !data.items?.some((i) => i.product.id === testProductId));
    recordResult('POST /api/cart (Remove Item from Cart)', passed, {
      status: res.status,
      remainingCount: data.items?.length,
    });
  } catch (err) {
    recordResult('POST /api/cart (Remove Item from Cart)', false, { error: err.message });
  }

  // Test 8: POST /api/cart - Clear Cart
  try {
    // Add item first then clear
    const preRes = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        productId: 'prod-2',
        quantity: 1,
        action: 'add',
      }),
    });
    await preRes.json();

    const res = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        action: 'clear',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.items?.length === 0;
    recordResult('POST /api/cart (Clear Cart)', passed, {
      status: res.status,
      cartLengthAfterClear: data.items?.length,
    });
  } catch (err) {
    recordResult('POST /api/cart (Clear Cart)', false, { error: err.message });
  }

  // Test 9 & 10: GET /api/cart/stream & Real-time Instant Cart Sync (<100ms)
  try {
    const { execSync } = await import('child_process');
    const sseOutput = execSync('node scripts/test-cart-sse.mjs', { encoding: 'utf-8' });
    const jsonMatch = sseOutput.match(/REAL-TIME CART SSE VERIFICATION RESULT:\s*(\{[\s\S]*?\})\s*===/);
    let sseResult = null;
    if (jsonMatch) {
      sseResult = JSON.parse(jsonMatch[1]);
    }

    const ssePassed = sseResult && sseResult.success && sseResult.receivedSync;
    recordResult('GET /api/cart/stream (SSE Stream Handshake & Initial cart_sync)', !!ssePassed, {
      receivedInitialState: sseResult?.receivedSync ?? false,
    });

    const latencyMeetsSla = sseResult && sseResult.passedThreshold;
    recordResult('Real-time Cart Synchronization (<100ms Latency SLA)', !!latencyMeetsSla, {
      latencyMs: sseResult?.latencyMs ? Number(sseResult.latencyMs.toFixed(2)) : null,
      threshold: '< 100ms',
      receivedUpdatedEvent: sseResult?.receivedUpdated ?? false,
      itemsCount: sseResult?.itemsCount ?? 0,
    });
  } catch (err) {
    recordResult('GET /api/cart/stream & Real-time Cart Synchronization', false, { error: err.message });
  }

  // Test 11: POST /api/checkout (Order Creation)
  let createdOrder = null;
  try {
    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        items: [
          {
            product: testProduct || {
              id: 'prod-1',
              name: 'AeroSound Pro Wireless ANC Headphones',
              price: 299.99,
              imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            },
            quantity: 1,
          },
        ],
        shippingAddress: {
          fullName: 'E2E Verified Tester',
          email: TEST_EMAIL,
          address: '456 Automation Boulevard',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'United States',
        },
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && !!data.order?.orderNumber;
    if (passed) {
      createdOrder = data.order;
    }
    recordResult('POST /api/checkout (Checkout Processing & Neon Persistence)', passed, {
      status: res.status,
      orderNumber: data.order?.orderNumber,
      orderId: data.order?.id,
      total: data.order?.total,
      resendStatus: data.order?.resendStatus,
    });
  } catch (err) {
    recordResult('POST /api/checkout (Checkout Processing & Neon Persistence)', false, { error: err.message });
  }

  // Test 12: GET /api/orders?email=... (Order History Retrieval)
  try {
    const res = await fetch(`${BASE_URL}/api/orders?email=${encodeURIComponent(TEST_EMAIL)}`);
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && Array.isArray(data.orders) && data.orders.length > 0;
    recordResult('GET /api/orders?email=... (Order History Retrieval)', passed, {
      status: res.status,
      ordersFound: data.orders?.length,
      latestOrderNumber: data.orders?.[0]?.orderNumber,
      customerEmail: data.orders?.[0]?.customerEmail,
    });
  } catch (err) {
    recordResult('GET /api/orders?email=... (Order History Retrieval)', false, { error: err.message });
  }

  console.log('\n===============================================================');
  console.log('📊 FINAL TEST SCORECARD');
  console.log('===============================================================');
  const totalPassed = results.filter((r) => r.status === 'PASS').length;
  const totalTests = results.length;
  console.log(`Passed: ${totalPassed} / ${totalTests} (${((totalPassed / totalTests) * 100).toFixed(0)}%)`);

  if (totalPassed === totalTests) {
    console.log('🎉 ALL INTEGRATION AND REAL-TIME TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('⚠️ SOME TESTS FAILED. Inspect details above.');
    process.exit(1);
  }
}

runTests();
