import { NextRequest, NextResponse } from 'next/server';
import { generateClientEmailDraft } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction, clientName, accountantName } = body;

    if (!transaction || !transaction.description || transaction.amount === undefined) {
      return NextResponse.json({ error: 'Valid transaction data is required' }, { status: 400 });
    }

    const draft = await generateClientEmailDraft(
      transaction,
      clientName || 'Client',
      accountantName || 'Forward-Deployed Accountant'
    );

    return NextResponse.json({ draft }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/draft-email:', error);
    return NextResponse.json({ error: error?.message || 'Failed to draft email' }, { status: 500 });
  }
}
