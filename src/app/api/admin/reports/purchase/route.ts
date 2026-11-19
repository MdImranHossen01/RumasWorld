import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import SupplierBill from '@/models/SupplierBill';
import '@/models/Supplier';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    await connectToDatabase();

    const matchQuery: any = {};
    if (from || to) {
      matchQuery.date = {};
      if (from) matchQuery.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = toDate;
      }
    }

    const bills = await SupplierBill.find(matchQuery)
      .populate('supplier', 'name companyName phone')
      .sort({ date: -1 })
      .limit(200)
      .lean()
      .catch(() => []);

    let formattedBills = (bills || []).map((bill: any) => ({
      _id: bill._id,
      date: bill.date,
      invoiceNo: bill.billNo,
      supplierName: bill.supplier?.name || bill.supplier?.companyName || 'Supplier',
      supplierPhone: bill.supplier?.phone || '',
      itemsCount: bill.items?.length || 0,
      totalAmount: bill.total || bill.subtotal || 0,
      paidAmount: bill.paidAmount || 0,
      dueAmount: bill.dueAmount || 0,
      status: bill.status || (bill.dueAmount > 0 ? 'Due' : 'Paid')
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      formattedBills = formattedBills.filter((b: any) =>
        b.invoiceNo?.toLowerCase().includes(q) ||
        b.supplierName?.toLowerCase().includes(q) ||
        b.supplierPhone?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ purchases: formattedBills });
  } catch (error) {
    console.error('Purchase Report API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
