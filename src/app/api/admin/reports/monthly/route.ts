import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Bill from '@/models/Bill';
import Expense from '@/models/Expense';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || now.getFullYear().toString(), 10);

    const startDate = new Date(`${year}-01-01T00:00:00+06:00`);
    const endDate = new Date(`${year}-12-31T23:59:59.999+06:00`);

    const orderMatch: any = {
      status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { deletedAt: null },
        { paymentStatus: 'Paid' },
        { status: 'Delivered' }
      ],
    };

    const billMatch: any = {
      documentType: 'bill',
      date: { $gte: startDate, $lte: endDate },
    };

    await connectToDatabase();

    const [ordersAggregation, billsAggregation, expensesAggregation] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: '+06:00' } },
            totalSales: { $sum: '$totalAmount' },
            deliveryCost: { $sum: { $ifNull: ['$deliveryCharge', 0] } },
            orderCount: { $sum: 1 },
            cogs: {
              $sum: {
                $sum: {
                  $map: {
                    input: '$items',
                    as: 'item',
                    in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                  }
                }
              }
            }
          }
        }
      ]),
      Bill.aggregate([
        { $match: billMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: '+06:00' } },
            totalSales: { $sum: { $ifNull: ['$total', '$gTotal'] } },
            deliveryCost: { $sum: { $ifNull: ['$deliveryCharge', 0] } },
            orderCount: { $sum: 1 }
          }
        }
      ]),
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: { $ne: 'income' },
            status: 'Approved',
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: '+06:00' } },
            expense: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const orderMap = new Map<string, any>();
    ordersAggregation.forEach(o => orderMap.set(o._id, o));

    const billMap = new Map<string, any>();
    billsAggregation.forEach(b => billMap.set(b._id, b));

    const expenseMap = new Map<string, number>();
    expensesAggregation.forEach(e => expenseMap.set(e._id, e.expense || 0));

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyRows = [];
    let summaryNetSales = 0;
    let summaryDeliveryCost = 0;
    let summaryTotal = 0;
    let summaryCOGS = 0;
    let summarySalesProfit = 0;
    let summaryExpense = 0;
    let summaryNetProfit = 0;
    let summaryOrderCount = 0;

    for (let m = 12; m >= 1; m--) {
      const monthStr = m.toString().padStart(2, '0');
      const monthKey = `${year}-${monthStr}`;
      const monthName = monthNames[m - 1];

      const orderData = orderMap.get(monthKey) || { totalSales: 0, deliveryCost: 0, cogs: 0, orderCount: 0 };
      const billData = billMap.get(monthKey) || { totalSales: 0, deliveryCost: 0, orderCount: 0 };
      const expense = expenseMap.get(monthKey) || 0;

      const total = (orderData.totalSales || 0) + (billData.totalSales || 0);
      const deliveryCost = (orderData.deliveryCost || 0) + (billData.deliveryCost || 0);
      const netSales = Math.max(0, total - deliveryCost);
      const cogs = orderData.cogs || 0;
      const salesProfit = Math.max(0, netSales - cogs);
      const netProfit = salesProfit - expense;
      const orderCount = (orderData.orderCount || 0) + (billData.orderCount || 0);

      summaryNetSales += netSales;
      summaryDeliveryCost += deliveryCost;
      summaryTotal += total;
      summaryCOGS += cogs;
      summarySalesProfit += salesProfit;
      summaryExpense += expense;
      summaryNetProfit += netProfit;
      summaryOrderCount += orderCount;

      monthlyRows.push({
        monthNumber: m,
        month: monthName,
        monthName,
        monthKey,
        orders: orderCount,
        orderCount,
        netSales,
        deliveryCost,
        total,
        totalSales: total,
        cogs,
        productCost: cogs,
        salesProfit,
        grossProfit: salesProfit,
        expense,
        netProfit
      });
    }

    return NextResponse.json({
      year,
      rows: monthlyRows,
      monthlyRows,
      summary: {
        totalNetSales: summaryNetSales,
        netSales: summaryNetSales,
        totalDeliveryCost: summaryDeliveryCost,
        deliveryCost: summaryDeliveryCost,
        grandTotal: summaryTotal,
        totalSales: summaryTotal,
        totalCOGS: summaryCOGS,
        cogs: summaryCOGS,
        totalOrderCount: summaryOrderCount,
        orderCount: summaryOrderCount,
        totalSalesProfit: summarySalesProfit,
        salesProfit: summarySalesProfit,
        grossProfit: summarySalesProfit,
        totalExpense: summaryExpense,
        expense: summaryExpense,
        totalNetProfit: summaryNetProfit,
        netProfit: summaryNetProfit
      }
    });
  } catch (error) {
    console.error('Monthly Report API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
