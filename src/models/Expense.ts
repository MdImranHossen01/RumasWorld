import mongoose, { Document, Model, Schema } from 'mongoose';

import './LedgerAccount';
export interface IExpense extends Document {
  title: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  date: Date;
  description?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  supplier?: mongoose.Types.ObjectId;
  customerPhone?: string;
  accountCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema<IExpense> = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    category: {
      type: String,
      required: true,
      default: 'Others',
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
      required: true,
    },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Approved',
      required: true,
    },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    customerPhone: { type: String },
    accountCode: {
      type: String,
      default: 'CASH',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast dashboard and report aggregation
ExpenseSchema.index({ date: -1, status: 1, type: 1 });
ExpenseSchema.index({ type: 1, status: 1, date: -1 });

if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}
const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;

