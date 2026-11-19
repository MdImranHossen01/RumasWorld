/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';
import Bill from '@/models/Bill';
import LedgerAccount from '@/models/LedgerAccount';
import LoanProvider from '@/models/LoanProvider';
import SupplierBill from '@/models/SupplierBill';
import BusinessLoan from '@/models/BusinessLoan';
import Supplier from '@/models/Supplier';
import Subscriber from '@/models/Subscriber';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = new Date(Date.UTC(parsedFrom.getUTCFullYear(), parsedFrom.getUTCMonth(), parsedFrom.getUTCDate()));
      }
    } else {
      startDate = new Date(Date.UTC(defaultFrom.getUTCFullYear(), defaultFrom.getUTCMonth(), defaultFrom.getUTCDate()));
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = new Date(Date.UTC(parsedTo.getUTCFullYear(), parsedTo.getUTCMonth(), parsedTo.getUTCDate(), 23, 59, 59, 999));
      }
    } else {
      endDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999));
    }

    await connectToDatabase();

    // Previous Period Calculation for Dynamic Growth Comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate.getTime() - 1);

    // 7 Days Range Calculation for 7-day Matrix
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const activeOrderFilter = {
      $or: [
        { deletedAt: null },
        { paymentStatus: 'Paid' },
        { status: 'Delivered' }
      ]
    };

    const [
      revenueStats,
      prevRevenueStats,
      expenseStats,
      prevExpenseStats,
      incomeStats,
      orderStatusStats,
      totalCustomersCount,
      subscribersCount,
      stockValueStats,
      lowStockProducts,
      ledgerAccounts,
      loanProviders,
      dueBills,
      dueSupplierBills,
      activeBusinessLoans,
      pendingExpensesList,
      totalSuppliersCount,
      expiringProductsCount,
      expiredProductsCount,
      totalAllProductsCount,
      publishedProductsCount,
      allUsersWithOrders,
      topSellingProducts,
      topCustomers,
      recentOrders,
      chartOrdersData,
      chartExpensesData,
      sevenDaysOrders,
      sevenDaysExpenses
    ] = await Promise.all([
      // 1. Revenue, COGS, Delivery charge stats (Current Period)
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            ...activeOrderFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalDeliveryCharge: { $sum: '$deliveryCharge' },
            salesCount: { $sum: 1 },
            paidRevenue: {
              $sum: {
                $cond: [{ $in: ['$status', ['Paid', 'Delivered']] }, '$totalAmount', 0]
              }
            },
            totalCOGS: {
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

      // 1b. Previous Period Revenue Stats
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: prevStartDate, $lte: prevEndDate },
            ...activeOrderFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalDeliveryCharge: { $sum: '$deliveryCharge' },
            salesCount: { $sum: 1 },
            totalCOGS: {
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

      // 2. Expenses (Current Period)
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: { $ne: 'income' },
            status: { $ne: 'Rejected' }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        }
      ]),

      // 2b. Previous Period Expenses
      Expense.aggregate([
        {
          $match: {
            date: { $gte: prevStartDate, $lte: prevEndDate },
            type: { $ne: 'income' },
            status: { $ne: 'Rejected' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),

      // 2c. Incomes (Current Period)
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: 'income',
            status: { $ne: 'Rejected' }
          }
        },
        {
          $group: {
            _id: null,
            totalIncomes: { $sum: '$amount' }
          }
        }
      ]),

      // 3. Order counts grouped by workflow status
      Order.aggregate([
        { $match: activeOrderFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]),

      // 4. Registered customers
      User.countDocuments({ role: 'user' }),

      // 5. Subscribers
      Subscriber.countDocuments({ isActive: true }).catch(() => 0),

      // 6. Stock & Stock Purchase Value (accounting for variant stocks)
      Product.aggregate([
        { $match: { isPublished: true } },
        {
          $addFields: {
            effectiveStock: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: '$variants' },
                    { $gt: [{ $size: '$variants' }, 0] }
                  ]
                },
                then: { $sum: '$variants.stock' },
                else: { $ifNull: ['$stock', 0] }
              }
            },
            effectivePurchasePrice: {
              $ifNull: [
                '$purchasePrice',
                {
                  $cond: {
                    if: {
                      $and: [
                        { $isArray: '$variants' },
                        { $gt: [{ $size: '$variants' }, 0] },
                        { $ne: [{ $arrayElemAt: ['$variants.purchasePrice', 0] }, null] }
                      ]
                    },
                    then: { $arrayElemAt: ['$variants.purchasePrice', 0] },
                    else: { $multiply: ['$price', 0.7] }
                  }
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalStockQuantity: { $sum: '$effectiveStock' },
            totalStockValue: {
              $sum: { $multiply: ['$effectiveStock', '$effectivePurchasePrice'] }
            }
          }
        }
      ]),

      // 7. Low Stock alerts (stock < 5)
      Product.find({ stock: { $lt: 5 } })
        .select('name stock price images slug')
        .limit(6)
        .lean(),

      // 8. Ledger Accounts & Loan Providers
      LedgerAccount.find({}).lean().catch(() => []),
      LoanProvider.find({}).sort({ name: 1 }).lean().catch(() => []),

      // 9. Due Client Bills
      Bill.find({ documentType: 'bill', status: 'Due' }).lean().catch(() => []),

      // 10. Due Supplier Bills & Active Business Loans
      SupplierBill.find({ status: 'Due' }).lean().catch(() => []),
      BusinessLoan.find({ status: 'Active' }).lean().catch(() => []),

      // 11. Pending Expenses
      Expense.find({ type: 'expense', status: 'Pending' }).select('amount').lean().catch(() => []),

      // 12. Suppliers Count
      Supplier.countDocuments().catch(() => 0),

      // 13. Expiring & Expired Products
      Product.countDocuments({
        $or: [
          { batches: { $elemMatch: { expiryDate: { $gte: now, $lte: thirtyDaysFromNow } } } },
          { 'variants.batches': { $elemMatch: { expiryDate: { $gte: now, $lte: thirtyDaysFromNow } } } }
        ]
      }).catch(() => 0),
      Product.countDocuments({
        $or: [
          { batches: { $elemMatch: { expiryDate: { $lt: now } } } },
          { 'variants.batches': { $elemMatch: { expiryDate: { $lt: now } } } }
        ]
      }).catch(() => 0),

      // 14. Total Products Counts
      Product.countDocuments({}),
      Product.countDocuments({ isPublished: true }),

      // 15. Users with Orders (New vs Returning Buyers)
      Order.aggregate([
        {
          $match: {
            deletedAt: null,
            user: { $ne: null },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]),

      // 16. Top 5 Best-Selling Products
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            ...activeOrderFilter
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' },
            ordersCount: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // 17. Top 5 Customers
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            user: { $ne: null },
            ...activeOrderFilter
          }
        },
        {
          $group: {
            _id: '$user',
            totalSpend: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpend: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: '$userData' },
        {
          $project: {
            name: '$userData.name',
            email: '$userData.email',
            phone: '$userData.phone',
            totalSpend: 1,
            orderCount: 1
          }
        }
      ]),

      // 18. Recent 5 Orders
      Order.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('slug totalAmount status createdAt user shippingAddress')
        .populate('user', 'name email phone')
        .lean(),

      // 19. Daily Chart Orders Data
      Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            createdAt: { $gte: startDate, $lte: endDate },
            ...activeOrderFilter
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
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
            },
            deliveryCharge: { $sum: '$deliveryCharge' }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
            orders: 1,
            cogs: 1,
            profit: { $subtract: [{ $subtract: ['$revenue', '$cogs'] }, '$deliveryCharge'] }
          }
        },
        { $sort: { date: 1 } }
      ]),

      // 20. Daily Chart Expenses Data
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            type: { $ne: 'income' },
            status: { $ne: 'Rejected' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            expense: { $sum: '$amount' }
          }
        }
      ]),

      // 21. Last 7 Days Orders for Performance Matrix
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            ...activeOrderFilter
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
            deliveredSales: {
              $sum: {
                $cond: [{ $in: ['$status', ['Paid', 'Delivered']] }, '$totalAmount', 0]
              }
            }
          }
        }
      ]),

      // 22. Last 7 Days Expenses for Performance Matrix
      Expense.aggregate([
        {
          $match: {
            date: { $gte: sevenDaysAgo },
            type: { $ne: 'income' },
            status: { $ne: 'Rejected' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            expense: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Process Current Revenue Stats
    const {
      totalRevenue = 0,
      totalDeliveryCharge = 0,
      salesCount = 0,
      paidRevenue = 0,
      totalCOGS = 0
    } = revenueStats[0] || {};

    // Process Previous Revenue Stats
    const {
      totalRevenue: prevTotalRevenue = 0,
      totalDeliveryCharge: prevDeliveryCharge = 0,
      salesCount: prevSalesCount = 0,
      totalCOGS: prevTotalCOGS = 0
    } = prevRevenueStats[0] || {};

    // Process Current Expense Stats
    let totalExpenses = 0;
    const expenseCategories: Record<string, number> = {};
    expenseStats.forEach((e: any) => {
      totalExpenses += e.total || 0;
      expenseCategories[e._id || 'Others'] = e.total || 0;
    });

    const prevTotalExpenses = prevExpenseStats[0]?.total || 0;
    const totalIncomes = incomeStats[0]?.totalIncomes || 0;

    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const prevGrossProfit = prevTotalRevenue - prevTotalCOGS - prevDeliveryCharge;
    const netProfit = grossProfit + totalIncomes - totalExpenses;

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) {
        return curr > 0 ? 100 : (curr < 0 ? -100 : 0);
      }
      return parseFloat((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
    };

    const growth = {
      revenue: calcGrowth(totalRevenue, prevTotalRevenue),
      expense: calcGrowth(totalExpenses, prevTotalExpenses),
      profit: calcGrowth(grossProfit, prevGrossProfit),
      orders: calcGrowth(salesCount, prevSalesCount)
    };

    // Process Order Workflow Status
    const statusMap: Record<string, { count: number; total: number }> = {};
    orderStatusStats.forEach((st: any) => {
      statusMap[st._id] = { count: st.count, total: st.totalAmount };
    });

    const pendingOrdersCount = statusMap['Order Placed']?.count || 0;
    const pendingOrdersAmount = statusMap['Order Placed']?.total || 0;
    const processingOrdersCount =
      (statusMap['Confirmed']?.count || 0) +
      (statusMap['Ready for Delivery']?.count || 0) +
      (statusMap['Released for Delivery']?.count || 0);
    const deliveredOrdersCount = statusMap['Delivered']?.count || 0;
    const cancelledOrdersCount = statusMap['Cancelled']?.count || 0;

    const stockStats = stockValueStats[0] || { totalStockQuantity: 0, totalStockValue: 0 };

    // Process Ledger Accounts
    const cashAccount = (ledgerAccounts as any[]).find((a: any) => a.code === 'CASH' || a.accountCategory === 'Cash');
    const bankAccounts = (ledgerAccounts as any[]).filter((a: any) => a.accountCategory === 'Bank' && a.code !== 'BANK');
    const mfsAccounts = (ledgerAccounts as any[]).filter((a: any) => a.accountCategory === 'MFS');

    const cashBalance = cashAccount ? (cashAccount.currentBalance || 0) : 0;
    const bankBalancesList = bankAccounts.map((a: any) => ({ id: String(a._id), name: a.name, balance: a.currentBalance || 0 }));
    const mfsBalancesList = mfsAccounts.map((a: any) => ({ id: String(a._id), name: a.name, balance: a.currentBalance || 0 }));

    const bankBalance = bankBalancesList.reduce((sum, b) => sum + b.balance, 0);
    const mfsBalanceTotal = mfsBalancesList.reduce((sum, m) => sum + m.balance, 0);
    const totalLiquidBalance = cashBalance + bankBalance + mfsBalanceTotal;

    // Receivables & Payables
    const todayDate = new Date();
    const totalBillDue = (dueBills as any[]).reduce((sum: number, b: any) => sum + (b.currentBillDue || 0), 0);
    const maturedBillDue = (dueBills as any[]).reduce((sum: number, b: any) => {
      if (b.expectedReceivableDate && new Date(b.expectedReceivableDate) < todayDate) {
        return sum + (b.currentBillDue || 0);
      }
      return sum;
    }, 0);

    const pendingOrderReceivable = Math.max(0, totalRevenue - paidRevenue);
    const arAccount = (ledgerAccounts as any[]).find((acc: any) => acc.code === 'AR');
    const totalReceivable = arAccount && (arAccount.currentBalance || 0) > 0
      ? arAccount.currentBalance
      : (totalBillDue + pendingOrderReceivable);

    const supplierBillsDueTotal = (dueSupplierBills as any[]).reduce((sum: number, b: any) => sum + (b.dueAmount || 0), 0);
    const maturedSupplierPayable = (dueSupplierBills as any[]).reduce((sum: number, b: any) => {
      if (b.expectedPaymentDate && new Date(b.expectedPaymentDate) < todayDate) {
        return sum + (b.dueAmount || 0);
      }
      return sum;
    }, 0);

    const totalActiveLoansDue = (activeBusinessLoans as any[]).reduce((sum: number, l: any) => sum + (l.dueAmount || 0), 0);
    const maturedBusinessLoan = (activeBusinessLoans as any[]).reduce((sum: number, l: any) => {
      let maturedAmount = 0;
      if (l.repaymentType === 'Installment') {
        if (l.installmentDayOfMonth && l.installmentAmount && l.date) {
          const loanStartDate = new Date(l.date);
          let diffMonths = (todayDate.getFullYear() - loanStartDate.getFullYear()) * 12 + (todayDate.getMonth() - loanStartDate.getMonth());
          if (todayDate.getDate() < l.installmentDayOfMonth) diffMonths--;
          const passedInstallments = Math.max(0, diffMonths);
          const expectedPaid = passedInstallments * l.installmentAmount;
          maturedAmount = Math.max(0, expectedPaid - (l.paidAmount || 0));
        }
      } else if (l.expectedRepaymentDate && new Date(l.expectedRepaymentDate) < todayDate) {
        maturedAmount = l.dueAmount || 0;
      }
      return sum + maturedAmount;
    }, 0);

    const pendingExpenseCount = (pendingExpensesList as any[]).length;
    const pendingExpenseTotal = (pendingExpensesList as any[]).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);

    const totalAssetValue = stockStats.totalStockValue + totalReceivable + totalLiquidBalance;

    // Customer breakdown
    const returningUsersCount = allUsersWithOrders.filter((u: any) => u.count > 1).length;
    const newUsersCount = allUsersWithOrders.filter((u: any) => u.count === 1).length;

    // Merge Daily Chart Data
    const chartDateMap = new Map<string, any>();
    chartOrdersData.forEach((d: any) => {
      chartDateMap.set(d.date, {
        date: d.date,
        revenue: d.revenue || 0,
        orders: d.orders || 0,
        cogs: d.cogs || 0,
        profit: d.profit || 0,
        expense: 0,
        netIncome: d.profit || 0
      });
    });

    chartExpensesData.forEach((item: any) => {
      const dateKey = item._id;
      const expenseAmount = item.expense || 0;
      const existing = chartDateMap.get(dateKey);
      if (existing) {
        existing.expense = expenseAmount;
        existing.netIncome = (existing.profit || 0) - expenseAmount;
      } else {
        chartDateMap.set(dateKey, {
          date: dateKey,
          revenue: 0,
          orders: 0,
          cogs: 0,
          profit: 0,
          expense: expenseAmount,
          netIncome: -expenseAmount
        });
      }
    });

    const completeChartData = Array.from(chartDateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Build 7-Day Performance Matrix Table
    const last7DaysMap = new Map();
    sevenDaysOrders.forEach((o: any) => {
      last7DaysMap.set(o._id, {
        sales: o.sales || 0,
        orders: o.orders || 0,
        collected: o.deliveredSales || 0,
        expense: 0
      });
    });

    sevenDaysExpenses.forEach((e: any) => {
      const existing = last7DaysMap.get(e._id) || { sales: 0, orders: 0, collected: 0, expense: 0 };
      existing.expense = e.expense || 0;
      last7DaysMap.set(e._id, existing);
    });

    const last7DaysList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dDay = d.getDate().toString().padStart(2, '0');
      const dMonth = d.toLocaleString('en-US', { month: 'short' });
      const dYear = d.getFullYear();

      const dayData = last7DaysMap.get(dateKey) || { sales: 0, orders: 0, collected: 0, expense: 0 };
      last7DaysList.push({
        date: dateKey,
        displayDate: `${dDay} ${dMonth}, ${dYear}`,
        sales: dayData.sales,
        orders: dayData.orders,
        collected: dayData.collected,
        expense: dayData.expense,
        net: dayData.sales - dayData.expense
      });
    }

    return NextResponse.json({
      stats: {
        totalRevenue,
        paidRevenue,
        totalDeliveryCharge,
        salesCount,
        totalCOGS,
        totalExpenses,
        expenseCategories,
        grossProfit,
        netProfit,
        growth,
        totalCustomers: totalCustomersCount,
        newUsersCount,
        returningUsersCount,
        subscribersCount,
        totalSuppliersCount,
        pendingOrdersCount,
        pendingOrdersAmount,
        processingOrdersCount,
        deliveredOrdersCount,
        cancelledOrdersCount,
        totalStockQuantity: stockStats.totalStockQuantity,
        totalStockValue: stockStats.totalStockValue,
        totalProductsCount: totalAllProductsCount,
        publishedProductsCount,
        expiringProductsCount,
        expiredProductsCount,
        cashBalance,
        bankBalance,
        bankBalancesList,
        mfsBalance: mfsBalanceTotal,
        mfsBalanceTotal,
        mfsBalancesList,
        totalLiquidBalance,
        totalBillDue,
        maturedBillDue,
        totalReceivable,
        maturedReceivable: maturedBillDue,
        totalAssetValue,
        supplierBillsDueTotal,
        supplierPayable: supplierBillsDueTotal,
        maturedSupplierPayable,
        totalActiveLoansDue,
        businessLoanPayable: totalActiveLoansDue,
        maturedBusinessLoan,
        maturedPayable: maturedSupplierPayable + maturedBusinessLoan,
        pendingExpenseCount,
        pendingExpenseTotal,
        ledgerAccounts: ledgerAccounts || [],
        loanProviders: loanProviders || []
      },
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      recentOrders,
      chartData: completeChartData,
      last7DaysStats: last7DaysList
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
