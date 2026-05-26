import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  institution: text("institution"),
  color: text("color").notNull().default("#39ff14"),
  creditLimitCents: integer("credit_limit_cents"),
  closingDay: integer("closing_day"),
  dueDay: integer("due_day"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  color: text("color").notNull().default("#39ff14"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactionGroups = pgTable("transaction_groups", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  installmentAmountCents: integer("installment_amount_cents").notNull(),
  installmentCount: integer("installment_count").notNull().default(1),
  firstDate: date("first_date").notNull(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaries = pgTable(
  "salaries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    amountCents: integer("amount_cents").notNull(),
    paymentDay: integer("payment_day").notNull().default(5),
    startMonth: text("start_month").notNull(),
    endMonth: text("end_month"),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("salaries_start_month_idx").on(table.startMonth),
    index("salaries_status_idx").on(table.status),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => transactionGroups.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    type: text("type").notNull(),
    amountCents: integer("amount_cents").notNull(),
    transactionDate: date("transaction_date").notNull(),
    competencyMonth: text("competency_month").notNull(),
    installmentNumber: integer("installment_number").notNull().default(1),
    installmentTotal: integer("installment_total").notNull().default(1),
    status: text("status").notNull().default("planned"),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transactions_competency_month_idx").on(table.competencyMonth),
    index("transactions_type_idx").on(table.type),
    index("transactions_account_id_idx").on(table.accountId),
    index("transactions_category_id_idx").on(table.categoryId),
  ],
);

export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: serial("id").primaryKey(),
    messageId: text("message_id").notNull(),
    instanceName: text("instance_name").notNull(),
    remoteJid: text("remote_jid").notNull(),
    phone: text("phone").notNull(),
    direction: text("direction").notNull(),
    text: text("text"),
    event: text("event"),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("whatsapp_messages_message_id_idx").on(table.messageId),
    index("whatsapp_messages_phone_idx").on(table.phone),
  ],
);

export const whatsappPendingActions = pgTable(
  "whatsapp_pending_actions",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    status: text("status").notNull().default("pending"),
    actionType: text("action_type").notNull(),
    summary: text("summary").notNull(),
    payload: jsonb("payload").notNull(),
    sourceMessageId: text("source_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("whatsapp_pending_actions_phone_status_idx").on(table.phone, table.status),
    index("whatsapp_pending_actions_expires_at_idx").on(table.expiresAt),
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  groups: many(transactionGroups),
  salaries: many(salaries),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  groups: many(transactionGroups),
  salaries: many(salaries),
}));

export const salariesRelations = relations(salaries, ({ one }) => ({
  account: one(accounts, {
    fields: [salaries.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [salaries.categoryId],
    references: [categories.id],
  }),
}));

export const transactionGroupsRelations = relations(
  transactionGroups,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [transactionGroups.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [transactionGroups.categoryId],
      references: [categories.id],
    }),
    transactions: many(transactions),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  group: one(transactionGroups, {
    fields: [transactions.groupId],
    references: [transactionGroups.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionGroup = typeof transactionGroups.$inferSelect;
export type NewTransactionGroup = typeof transactionGroups.$inferInsert;
export type Salary = typeof salaries.$inferSelect;
export type NewSalary = typeof salaries.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type WhatsappPendingAction = typeof whatsappPendingActions.$inferSelect;
export type NewWhatsappPendingAction = typeof whatsappPendingActions.$inferInsert;
