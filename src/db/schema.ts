import {
  pgTable,
  text,
  varchar,
  timestamp,
  numeric,
  boolean,
  integer,
  primaryKey,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ==============================================================================
// 1. AUTENTICACIÓN (Auth.js / NextAuth v5 Core Tables)
// ==============================================================================

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  preferredCurrency: varchar("preferred_currency", { length: 3 })
    .default("CLP")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ==============================================================================
// 2. BILLETERAS / CUENTAS PERSONALES (Wallets)
// ==============================================================================

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'cash' | 'bank' | 'credit_card' | 'savings' | 'other'
  currency: varchar("currency", { length: 3 }).default("CLP").notNull(),
  initialBalance: numeric("initial_balance", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  color: varchar("color", { length: 20 }).default("#10B981").notNull(),
  icon: varchar("icon", { length: 50 }).default("Wallet").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 3. CATEGORÍAS (Categorías jerárquicas con iconos)
// ==============================================================================

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // null = categoría global del sistema
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'expense' | 'income'
  icon: varchar("icon", { length: 50 }).default("Tag").notNull(),
  color: varchar("color", { length: 20 }).default("#6B7280").notNull(),
  parentId: uuid("parent_id"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 4. TRANSACCIONES PERSONALES (Transactions)
// ==============================================================================

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  destinationWalletId: uuid("destination_wallet_id").references(() => wallets.id, {
    onDelete: "set null",
  }), // Para transferencias entre cuentas
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  type: varchar("type", { length: 20 }).notNull(), // 'expense' | 'income' | 'transfer'
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  // Congelado al momento de crear para garantizar inmutabilidad histórica
  exchangeRateAtCreated: numeric("exchange_rate_at_created", {
    precision: 14,
    scale: 6,
  })
    .default("1.000000")
    .notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  attachments: text("attachments").array(), // Array de URLs de recibos
  sharedExpenseId: uuid("shared_expense_id"), // Vinculado a gasto compartido si aplica
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 5. GRUPOS Y MIEMBROS (Estilo Splitwise)
// ==============================================================================

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  baseCurrency: varchar("base_currency", { length: 3 }).default("CLP").notNull(),
  inviteCode: varchar("invite_code", { length: 36 })
    .notNull()
    .unique(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(), // 'admin' | 'member'
    // Saldo neto en el grupo (>0 le deben plata, <0 debe plata)
    netBalance: numeric("net_balance", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("group_user_unique_idx").on(table.groupId, table.userId),
  ]
);

// ==============================================================================
// 6. GASTOS COMPARTIDOS, DIVISIONES Y LIQUIDACIONES
// ==============================================================================

export const sharedExpenses = pgTable("shared_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  paidById: text("paid_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 255 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  exchangeRateAtCreated: numeric("exchange_rate_at_created", {
    precision: 14,
    scale: 6,
  })
    .default("1.000000")
    .notNull(),
  splitType: varchar("split_type", { length: 20 }).default("equal").notNull(), // 'equal' | 'exact' | 'percentage' | 'shares'
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  receiptUrl: text("receipt_url"),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const expenseSplits = pgTable("expense_splits", {
  id: uuid("id").defaultRandom().primaryKey(),
  sharedExpenseId: uuid("shared_expense_id")
    .notNull()
    .references(() => sharedExpenses.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  owedAmount: numeric("owed_amount", { precision: 14, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  shares: integer("shares").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settlements = pgTable("settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  isConfirmed: boolean("is_confirmed").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// RELACIONES DRIZZLE (Typed Query Support)
// ==============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  wallets: many(wallets),
  transactions: many(transactions),
  groupMemberships: many(groupMembers),
  createdGroups: many(groups),
  paidExpenses: many(sharedExpenses),
  splits: many(expenseSplits),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  subcategories: many(categories, { relationName: "categoryHierarchy" }),
  transactions: many(transactions),
  sharedExpenses: many(sharedExpenses),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.createdById], references: [users.id] }),
  members: many(groupMembers),
  expenses: many(sharedExpenses),
  settlements: many(settlements),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const sharedExpensesRelations = relations(sharedExpenses, ({ one, many }) => ({
  group: one(groups, { fields: [sharedExpenses.groupId], references: [groups.id] }),
  payer: one(users, { fields: [sharedExpenses.paidById], references: [users.id] }),
  splits: many(expenseSplits),
  category: one(categories, { fields: [sharedExpenses.categoryId], references: [categories.id] }),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(sharedExpenses, {
    fields: [expenseSplits.sharedExpenseId],
    references: [sharedExpenses.id],
  }),
  user: one(users, { fields: [expenseSplits.userId], references: [users.id] }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  group: one(groups, { fields: [settlements.groupId], references: [groups.id] }),
  fromUser: one(users, { fields: [settlements.fromUserId], references: [users.id] }),
  toUser: one(users, { fields: [settlements.toUserId], references: [users.id] }),
}));
