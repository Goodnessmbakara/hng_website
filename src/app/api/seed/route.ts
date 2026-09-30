import { NextResponse } from 'next/server';
import { initDb, isNeonConfigured } from '@/lib/db';

export async function GET() {
  const isConfigured = isNeonConfigured();
  const result = await initDb();

  return NextResponse.json({
    neonConfigured: isConfigured,
    ...result,
  });
}
