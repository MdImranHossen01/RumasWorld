import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Bill from '@/models/Bill';
import Order from '@/models/Order';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const todayDate = new Date();

    // Fetch Bills where currentBillDue > 0
    const bills = await Bill.find({ currentBillDue: { $gt: 0 } }).lean() as any[];

    // Group General Customers by clientPhone
    const generalMap = new Map<string, any>();
    for (const b of bills) {
      if (!b.clientPhone) continue;
      const phone = b.clientPhone.trim();
      const isMatured = b.expectedReceivableDate && new Date(b.expectedReceivableDate) < todayDate;
      const due = b.currentBillDue || 0;
      
      const existing = generalMap.get(phone);
      if (existing) {
        existing.totalDue += due;
        if (isMatured) existing.maturedDue += due;
        existing.billsCount += 1;
      } else {
        generalMap.set(phone, {
          name: b.clientName || 'General Customer',
          phone: phone,
          totalDue: due,
          maturedDue: isMatured ? due : 0,
          billsCount: 1
        });
      }
    }

    const generalCustomers = Array.from(generalMap.values()).sort((a, b) => b.totalDue - a.totalDue);

    return NextResponse.json({ generalCustomers });
  } catch (error: any) {
    console.error('API GET Receivable Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
