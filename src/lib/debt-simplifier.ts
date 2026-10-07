/**
 * Algoritmo Greedy de Simplificación de Deudas (Min-Cash-Flow) estilo Splitwise.
 * Transforma un grafo de N*(N-1) deudas cruzadas en a lo más N-1 transacciones óptimas.
 */

export interface MemberBalance {
  userId: string;
  userName?: string;
  netBalance: number; // > 0 es acreedor (le deben), < 0 es deudor (debe)
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  amount: number;
}

export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  // 1. Filtrar saldos con tolerancia de centavos (evitar ruido por redondeo de coma flotante)
  const EPSILON = 0.01;

  interface BalanceEntry {
    userId: string;
    userName?: string;
    amount: number;
  }

  const debtors: BalanceEntry[] = [];
  const creditors: BalanceEntry[] = [];

  for (const b of balances) {
    if (b.netBalance < -EPSILON) {
      debtors.push({
        userId: b.userId,
        userName: b.userName,
        amount: Math.abs(b.netBalance),
      });
    } else if (b.netBalance > EPSILON) {
      creditors.push({
        userId: b.userId,
        userName: b.userName,
        amount: b.netBalance,
      });
    }
  }

  // Ordenar de mayor a menor para voracidad óptima
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(settledAmount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: roundedAmount,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= EPSILON) {
      dIdx++;
    }
    if (creditor.amount <= EPSILON) {
      cIdx++;
    }
  }

  return transactions;
}
