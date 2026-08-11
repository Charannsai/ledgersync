import { NextRequest, NextResponse } from 'next/server';
import { classifyTransactionsWithAI, RawTransactionInput } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactions: RawTransactionInput[] = body.transactions || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    const classifications = await classifyTransactionsWithAI(transactions);

    return NextResponse.json({ classifications }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/classify:', error);
    return NextResponse.json({ error: error?.message || 'Failed to classify transactions' }, { status: 500 });
  }
}
