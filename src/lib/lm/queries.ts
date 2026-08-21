import { prisma } from "@/lib/prisma";
import { round2 } from "./money";
import { deriveTransactionStatus, deriveInstallmentStatus, matchesStatusFilter, type LmStatus } from "./status";

type InstallmentRow = { id: string; number: number; dueDate: Date; amount: number; paidAmount: number };
type TransactionRow = {
  id: string;
  type: string;
  principal: number;
  interest: number;
  totalAmount: number;
  paidAmount: number;
  startDate: Date;
  months: number | null;
  installmentsCount: number | null;
  notes: string | null;
  createdAt: Date;
  customerId: string;
  customer: { id: string; name: string };
  installments: InstallmentRow[];
};

export function withComputed(transaction: TransactionRow, today = new Date()) {
  const status = deriveTransactionStatus(transaction.installments, today);
  const remaining = round2(transaction.totalAmount - transaction.paidAmount);
  const dueDate = transaction.installments.reduce<Date | null>((max, i) => {
    return !max || i.dueDate > max ? i.dueDate : max;
  }, null);
  return { ...transaction, status, remaining, dueDate };
}

export type TransactionWithComputed = ReturnType<typeof withComputed>;

const transactionInclude = {
  customer: true,
  installments: { orderBy: { number: "asc" as const } },
};

export async function listUserTransactions(
  userId: string,
  filters: { search?: string; type?: string; status?: string } = {},
) {
  const rows = await prisma.lmTransaction.findMany({
    where: { userId },
    include: transactionInclude,
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  let items = rows.map((r) => withComputed(r, today));

  if (filters.type && filters.type !== "ALL") {
    items = items.filter((t) => t.type === filters.type);
  }
  if (filters.status && filters.status !== "ALL") {
    items = items.filter((t) => matchesStatusFilter(t.status, filters.status!));
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    items = items.filter((t) => t.customer.name.includes(q));
  }

  return items;
}

export async function getUserTransactionDetail(id: string, userId: string) {
  const row = await prisma.lmTransaction.findFirst({
    where: { id, userId },
    include: {
      ...transactionInclude,
      payments: { orderBy: { paymentDate: "desc" }, include: { allocations: true } },
    },
  });
  if (!row) return null;
  const today = new Date();
  const installmentsWithStatus = row.installments.map((i) => ({
    ...i,
    status: deriveInstallmentStatus(i, today),
    remaining: round2(i.amount - i.paidAmount),
  }));
  return { ...withComputed(row, today), installments: installmentsWithStatus, payments: row.payments };
}

export async function listUserCustomers(userId: string, search?: string) {
  const customers = await prisma.lmCustomer.findMany({
    where: { userId, ...(search?.trim() ? { name: { contains: search.trim() } } : {}) },
    include: { transactions: { include: transactionInclude } },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  return customers.map((c) => {
    const transactions = c.transactions.map((t) => withComputed(t, today));
    const totals = summarize(transactions);
    return {
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      transactionsCount: transactions.length,
      ...totals,
    };
  });
}

export async function getUserCustomerDetail(id: string, userId: string) {
  const customer = await prisma.lmCustomer.findFirst({
    where: { id, userId },
    include: {
      transactions: {
        include: { ...transactionInclude, payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) return null;
  const today = new Date();
  const transactions = customer.transactions.map((t) => withComputed(t, today));
  const totals = summarize(transactions);

  const payments = customer.transactions
    .flatMap((t) => t.payments.map((p) => ({ ...p, transactionType: t.type })))
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

  return { id: customer.id, name: customer.name, createdAt: customer.createdAt, transactions, payments, ...totals };
}

function summarize(transactions: ReturnType<typeof withComputed>[]) {
  const totalPrincipal = round2(transactions.reduce((s, t) => s + t.principal, 0));
  const totalInterest = round2(transactions.reduce((s, t) => s + t.interest, 0));
  const totalRequired = round2(transactions.reduce((s, t) => s + t.totalAmount, 0));
  const totalPaid = round2(transactions.reduce((s, t) => s + t.paidAmount, 0));
  const totalRemaining = round2(totalRequired - totalPaid);
  const activeCount = transactions.filter((t) => t.status !== "PAID").length;
  const paidCount = transactions.filter((t) => t.status === "PAID").length;
  const lateCount = transactions.filter((t) => t.status === "LATE").length;
  return { totalPrincipal, totalInterest, totalRequired, totalPaid, totalRemaining, activeCount, paidCount, lateCount };
}

export async function getUserDashboard(userId: string) {
  const [customersCount, rows] = await Promise.all([
    prisma.lmCustomer.count({ where: { userId } }),
    prisma.lmTransaction.findMany({ where: { userId }, include: transactionInclude }),
  ]);

  const today = new Date();
  const transactions = rows.map((r) => withComputed(r, today));
  const totals = summarize(transactions);

  // المبالغ المستحقة حاليًا = مجموع المتبقي على كل قسط متأخر أو مستحق اليوم
  let dueNowAmount = 0;
  for (const t of transactions) {
    for (const i of t.installments) {
      const s = deriveInstallmentStatus(i, today);
      if (s === "LATE" || s === "DUE_TODAY") dueNowAmount = round2(dueNowAmount + (i.amount - i.paidAmount));
    }
  }

  const upcoming = flattenDueInstallments(transactions, today, ["UPCOMING", "DUE_TODAY"])
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 8);
  const late = flattenDueInstallments(transactions, today, ["LATE"])
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 8);

  return { customersCount, ...totals, dueNowAmount, upcoming, late };
}

function flattenDueInstallments(
  transactions: ReturnType<typeof withComputed>[],
  today: Date,
  statuses: LmStatus[],
) {
  const out: { transactionId: string; customerName: string; type: string; dueDate: Date; amount: number; status: LmStatus }[] = [];
  for (const t of transactions) {
    for (const i of t.installments) {
      const s = deriveInstallmentStatus(i, today);
      if (statuses.includes(s)) {
        out.push({
          transactionId: t.id,
          customerName: t.customer.name,
          type: t.type,
          dueDate: i.dueDate,
          amount: round2(i.amount - i.paidAmount),
          status: s,
        });
      }
    }
  }
  return out;
}
