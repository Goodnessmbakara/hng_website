import http from 'http';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = `sse_perf_${Date.now()}`;

async function testCartSse() {
  console.log(`🚀 Starting Real-time Cart SSE Synchronization Verification for user: ${TEST_USER}`);

  return new Promise((resolve, reject) => {
    const sseUrl = `${BASE_URL}/api/cart/stream?userId=${TEST_USER}`;
    const req = http.get(sseUrl, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to connect to SSE stream: ${res.statusCode}`));
      }

      console.log('📡 Connected to SSE stream successfully. Status: 200');

      let receivedSync = false;
      let postTime = 0;
      let latencyMs = 0;

      res.on('data', (chunk) => {
        const text = chunk.toString();
        // Parse SSE data
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            try {
              const payload = JSON.parse(dataStr);
              console.log(`📩 SSE Event received: type="${payload.type}", items count=${payload.items?.length}`);

              if (payload.type === 'cart_sync') {
                receivedSync = true;
                console.log('✅ Received initial cart_sync state.');

                // Now fire cart addition and measure latency to cart_updated
                setTimeout(async () => {
                  console.log('⚡ Firing POST /api/cart addition to test real-time synchronization...');
                  postTime = performance.now();
                  try {
                    const postRes = await fetch(`${BASE_URL}/api/cart`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: TEST_USER,
                        productId: 'prod-1',
                        quantity: 1,
                        action: 'add',
                      }),
                    });
                    const postJson = await postRes.json();
                    console.log(`📦 POST /api/cart response: success=${postJson.success}`);
                  } catch (postErr) {
                    req.destroy();
                    reject(postErr);
                  }
                }, 100);
              } else if (payload.type === 'cart_updated') {
                const receiveTime = performance.now();
                latencyMs = receiveTime - postTime;
                console.log(`⚡ Received cart_updated via SSE stream!`);
                console.log(`⏱️ Latency (POST initiation to SSE event delivery): ${latencyMs.toFixed(2)}ms`);

                const pass = latencyMs < 100;
                console.log(`🎯 Latency Threshold Check (<100ms): ${pass ? 'PASSED ✅' : 'FAILED ❌'}`);

                req.destroy();
                resolve({
                  success: true,
                  receivedSync,
                  receivedUpdated: true,
                  latencyMs,
                  passedThreshold: pass,
                  itemsCount: payload.items?.length,
                });
              }
            } catch (err) {
              console.error('Error parsing SSE event data:', err);
            }
          }
        }
      });

      res.on('error', (err) => {
        reject(err);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    // Timeout after 10 seconds if no event received
    setTimeout(() => {
      req.destroy();
      reject(new Error('SSE verification timed out after 10 seconds'));
    }, 10000);
  });
}

testCartSse()
  .then((result) => {
    console.log('\n=======================================');
    console.log('REAL-TIME CART SSE VERIFICATION RESULT:');
    console.log(JSON.stringify(result, null, 2));
    console.log('=======================================\n');
    process.exit(result.passedThreshold ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ SSE Verification failed:', err);
    process.exit(1);
  });
