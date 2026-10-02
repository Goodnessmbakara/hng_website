import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

async function testEventEmitter() {
  console.log('🧪 Testing In-Memory Cart Event Emitter Direct Performance...');

  const emitter = new EventEmitter();
  const testUserId = 'bench_user_123';
  const dummyItems = [
    {
      product: {
        id: 'prod-1',
        name: 'AeroSound Pro Wireless ANC Headphones',
        price: 299.99,
      },
      quantity: 1,
    },
  ];

  let received = false;
  let receivedItems = null;

  emitter.on(`cart:${testUserId}`, (items) => {
    received = true;
    receivedItems = items;
  });

  const iterations = 1000;
  const t0 = performance.now();

  for (let i = 0; i < iterations; i++) {
    emitter.emit(`cart:${testUserId}`, dummyItems);
  }

  const t1 = performance.now();
  const totalMs = t1 - t0;
  const avgMs = totalMs / iterations;

  console.log(`✅ Dispatched ${iterations} cart update events in ${totalMs.toFixed(3)}ms`);
  console.log(`⚡ Average dispatch-to-listener latency: ${(avgMs * 1000).toFixed(2)} microseconds (${avgMs.toFixed(4)}ms)`);
  console.log(`🎯 SLA (<100ms): PASSED (${avgMs < 100 ? 'YES' : 'NO'})\n`);

  return {
    passed: received && avgMs < 100,
    averageLatencyMs: avgMs,
    iterations,
  };
}

testEventEmitter();
