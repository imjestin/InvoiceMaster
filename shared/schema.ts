import { pgTable, text, serial, numeric, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'team_member']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue']);
export const contributionTypeEnum = pgEnum('contribution_type', ['percentage', 'fixed']);
export const recurringFrequencyEnum = pgEnum('recurring_frequency', ['daily', 'weekly', 'monthly']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('team_member'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients Table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: serial("client_id").references(() => clients.id),
  status: projectStatusEnum("status").notNull().default('active'),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Team Members Table
export const projectTeamMembers = pgTable("project_team_members", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  userId: serial("user_id").references(() => users.id),
  role: text("role"),
  contribution: numeric("contribution").notNull(),
  contributionType: contributionTypeEnum("contribution_type").notNull(),
});

// Project Commissions Table
export const projectCommissions = pgTable("project_commissions", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  agentName: text("agent_name").notNull(),
  rate: numeric("rate").notNull(),
});

// Invoices Table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  projectId: serial("project_id").references(() => projects.id),
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(),
  total: numeric("total").notNull(),
  status: invoiceStatusEnum("status").notNull().default('draft'),
  notes: text("notes"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice Line Items Table
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: serial("invoice_id").references(() => invoices.id),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull(),
  rate: numeric("rate").notNull(),
  tax: numeric("tax"),
  amount: numeric("amount").notNull(),
});

// Recurring Invoices Table
export const recurringInvoices = pgTable("recurring_invoices", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  nextIssueDate: timestamp("next_issue_date").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastInvoiceId: serial("last_invoice_id").references(() => invoices.id),
  template: json("template").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Split Summary Table
export const projectSplitSummaries = pgTable("project_split_summaries", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  invoiceId: serial("invoice_id").references(() => invoices.id),
  totalAmount: numeric("total_amount").notNull(),
  teamTotal: numeric("team_total").notNull(),
  commission: numeric("commission").notNull(),
  companyProfit: numeric("company_profit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation and insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertProjectTeamMemberSchema = createInsertSchema(projectTeamMembers).omit({ id: true });
export const insertProjectCommissionSchema = createInsertSchema(projectCommissions).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({ id: true });
export const insertRecurringInvoiceSchema = createInsertSchema(recurringInvoices).omit({ id: true, createdAt: true });
export const insertProjectSplitSummarySchema = createInsertSchema(projectSplitSummaries).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = z.infer<typeof insertProjectTeamMemberSchema>;

export type ProjectCommission = typeof projectCommissions.$inferSelect;
export type InsertProjectCommission = z.infer<typeof insertProjectCommissionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;

export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type InsertRecurringInvoice = z.infer<typeof insertRecurringInvoiceSchema>;

export type ProjectSplitSummary = typeof projectSplitSummaries.$inferSelect;
export type InsertProjectSplitSummary = z.infer<typeof insertProjectSplitSummarySchema>;
