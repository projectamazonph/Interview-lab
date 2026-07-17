import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Paid plans are not currently available.' },
    { status: 503 }
  );
}
