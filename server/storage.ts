import { 
  users, User, InsertUser, 
  clients, Client, InsertClient, 
  projects, Project, InsertProject, 
  projectTeamMembers, ProjectTeamMember, InsertProjectTeamMember,
  projectCommissions, ProjectCommission, InsertProjectCommission,
  invoices, Invoice, InsertInvoice,
  invoiceLineItems, InvoiceLineItem, InsertInvoiceLineItem,
  recurringInvoices, RecurringInvoice, InsertRecurringInvoice,
  projectSplitSummaries, ProjectSplitSummary, InsertProjectSplitSummary
} from "@shared/schema";
import { eq, and, desc, sql, like, or, asc } from "drizzle-orm";
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { config } from "../shared/config";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClients(search?: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(clientId?: number, status?: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project Team Member methods
  getProjectTeamMembers(projectId: number): Promise<ProjectTeamMember[]>;
  createProjectTeamMember(member: InsertProjectTeamMember): Promise<ProjectTeamMember>;
  updateProjectTeamMember(id: number, member: Partial<InsertProjectTeamMember>): Promise<ProjectTeamMember | undefined>;
  deleteProjectTeamMember(id: number): Promise<boolean>;
  
  // Project Commission methods
  getProjectCommission(projectId: number): Promise<ProjectCommission | undefined>;
  createProjectCommission(commission: InsertProjectCommission): Promise<ProjectCommission>;
  updateProjectCommission(id: number, commission: Partial<InsertProjectCommission>): Promise<ProjectCommission | undefined>;
  deleteProjectCommission(id: number): Promise<boolean>;
  
  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(status?: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getInvoicesByProject(projectId: number): Promise<Invoice[]>;
  
  // Invoice Line Item methods
  getInvoiceLineItems(invoiceId: number): Promise<InvoiceLineItem[]>;
  createInvoiceLineItem(item: InsertInvoiceLineItem): Promise<InvoiceLineItem>;
  updateInvoiceLineItem(id: number, item: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem | undefined>;
  deleteInvoiceLineItem(id: number): Promise<boolean>;
  
  // Recurring Invoice methods
  getRecurringInvoice(id: number): Promise<RecurringInvoice | undefined>;
  getRecurringInvoices(): Promise<RecurringInvoice[]>;
  createRecurringInvoice(recurringInvoice: InsertRecurringInvoice): Promise<RecurringInvoice>;
  updateRecurringInvoice(id: number, recurringInvoice: Partial<InsertRecurringInvoice>): Promise<RecurringInvoice | undefined>;
  deleteRecurringInvoice(id: number): Promise<boolean>;
  
  // Project Split Summary methods
  getProjectSplitSummary(projectId: number, invoiceId: number): Promise<ProjectSplitSummary | undefined>;
  getProjectSplitSummaries(projectId?: number): Promise<ProjectSplitSummary[]>;
  createProjectSplitSummary(summary: InsertProjectSplitSummary): Promise<ProjectSplitSummary>;
  
  // Dashboard methods
  getDashboardStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private projectTeamMembers: Map<number, ProjectTeamMember>;
  private projectCommissions: Map<number, ProjectCommission>;
  private invoices: Map<number, Invoice>;
  private invoiceLineItems: Map<number, InvoiceLineItem>;
  private recurringInvoices: Map<number, RecurringInvoice>;
  private projectSplitSummaries: Map<number, ProjectSplitSummary>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private projectIdCounter: number;
  private teamMemberIdCounter: number;
  private commissionIdCounter: number;
  private invoiceIdCounter: number;
  private lineItemIdCounter: number;
  private recurringInvoiceIdCounter: number;
  private splitSummaryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.projectTeamMembers = new Map();
    this.projectCommissions = new Map();
    this.invoices = new Map();
    this.invoiceLineItems = new Map();
    this.recurringInvoices = new Map();
    this.projectSplitSummaries = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.projectIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.commissionIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.lineItemIdCounter = 1;
    this.recurringInvoiceIdCounter = 1;
    this.splitSummaryIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(search?: string): Promise<Client[]> {
    const clients = Array.from(this.clients.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      return clients.filter(client => 
        client.name.toLowerCase().includes(searchLower) || 
        client.email.toLowerCase().includes(searchLower) || 
        (client.company && client.company.toLowerCase().includes(searchLower))
      );
    }
    
    return clients;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const now = new Date();
    const client: Client = { ...insertClient, id, createdAt: now };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(clientId?: number, status?: string): Promise<Project[]> {
    let projects = Array.from(this.projects.values());
    
    if (clientId) {
      projects = projects.filter(project => project.clientId === clientId);
    }
    
    if (status) {
      projects = projects.filter(project => project.status === status);
    }
    
    return projects;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Project Team Member methods
  async getProjectTeamMembers(projectId: number): Promise<ProjectTeamMember[]> {
    return Array.from(this.projectTeamMembers.values()).filter(
      member => member.projectId === projectId
    );
  }

  async createProjectTeamMember(insertMember: InsertProjectTeamMember): Promise<ProjectTeamMember> {
    const id = this.teamMemberIdCounter++;
    const member: ProjectTeamMember = { ...insertMember, id };
    this.projectTeamMembers.set(id, member);
    return member;
  }

  async updateProjectTeamMember(id: number, memberData: Partial<InsertProjectTeamMember>): Promise<ProjectTeamMember | undefined> {
    const member = this.projectTeamMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...memberData };
    this.projectTeamMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteProjectTeamMember(id: number): Promise<boolean> {
    return this.projectTeamMembers.delete(id);
  }

  // Project Commission methods
  async getProjectCommission(projectId: number): Promise<ProjectCommission | undefined> {
    return Array.from(this.projectCommissions.values()).find(
      commission => commission.projectId === projectId
    );
  }

  async createProjectCommission(insertCommission: InsertProjectCommission): Promise<ProjectCommission> {
    const id = this.commissionIdCounter++;
    const commission: ProjectCommission = { ...insertCommission, id };
    this.projectCommissions.set(id, commission);
    return commission;
  }

  async updateProjectCommission(id: number, commissionData: Partial<InsertProjectCommission>): Promise<ProjectCommission | undefined> {
    const commission = this.projectCommissions.get(id);
    if (!commission) return undefined;
    
    const updatedCommission = { ...commission, ...commissionData };
    this.projectCommissions.set(id, updatedCommission);
    return updatedCommission;
  }

  async deleteProjectCommission(id: number): Promise<boolean> {
    return this.projectCommissions.delete(id);
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    let invoices = Array.from(this.invoices.values());
    
    if (status) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }
    
    return invoices;
  }

  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.projectId === projectId
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const now = new Date();
    const invoice: Invoice = { ...insertInvoice, id, createdAt: now };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Invoice Line Item methods
  async getInvoiceLineItems(invoiceId: number): Promise<InvoiceLineItem[]> {
    return Array.from(this.invoiceLineItems.values()).filter(
      item => item.invoiceId === invoiceId
    );
  }

  async createInvoiceLineItem(insertItem: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
    const id = this.lineItemIdCounter++;
    const item: InvoiceLineItem = { ...insertItem, id };
    this.invoiceLineItems.set(id, item);
    return item;
  }

  async updateInvoiceLineItem(id: number, itemData: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem | undefined> {
    const item = this.invoiceLineItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.invoiceLineItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInvoiceLineItem(id: number): Promise<boolean> {
    return this.invoiceLineItems.delete(id);
  }

  // Recurring Invoice methods
  async getRecurringInvoice(id: number): Promise<RecurringInvoice | undefined> {
    return this.recurringInvoices.get(id);
  }

  async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    return Array.from(this.recurringInvoices.values());
  }

  async createRecurringInvoice(insertRecurringInvoice: InsertRecurringInvoice): Promise<RecurringInvoice> {
    const id = this.recurringInvoiceIdCounter++;
    const now = new Date();
    const recurringInvoice: RecurringInvoice = { ...insertRecurringInvoice, id, createdAt: now };
    this.recurringInvoices.set(id, recurringInvoice);
    return recurringInvoice;
  }

  async updateRecurringInvoice(id: number, recurringInvoiceData: Partial<InsertRecurringInvoice>): Promise<RecurringInvoice | undefined> {
    const recurringInvoice = this.recurringInvoices.get(id);
    if (!recurringInvoice) return undefined;
    
    const updatedRecurringInvoice = { ...recurringInvoice, ...recurringInvoiceData };
    this.recurringInvoices.set(id, updatedRecurringInvoice);
    return updatedRecurringInvoice;
  }

  async deleteRecurringInvoice(id: number): Promise<boolean> {
    return this.recurringInvoices.delete(id);
  }

  // Project Split Summary methods
  async getProjectSplitSummary(projectId: number, invoiceId: number): Promise<ProjectSplitSummary | undefined> {
    return Array.from(this.projectSplitSummaries.values()).find(
      summary => summary.projectId === projectId && summary.invoiceId === invoiceId
    );
  }

  async getProjectSplitSummaries(projectId?: number): Promise<ProjectSplitSummary[]> {
    let summaries = Array.from(this.projectSplitSummaries.values());
    
    if (projectId) {
      summaries = summaries.filter(summary => summary.projectId === projectId);
    }
    
    return summaries;
  }

  async createProjectSplitSummary(insertSummary: InsertProjectSplitSummary): Promise<ProjectSplitSummary> {
    const id = this.splitSummaryIdCounter++;
    const now = new Date();
    const summary: ProjectSplitSummary = { ...insertSummary, id, createdAt: now };
    this.projectSplitSummaries.set(id, summary);
    return summary;
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    const invoices = Array.from(this.invoices.values());
    
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'sent');
    const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const paidAmount = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    return {
      totalRevenue,
      pendingAmount,
      pendingCount: pendingInvoices.length,
      overdueAmount,
      overdueCount: overdueInvoices.length,
      paidAmount,
      paidCount: paidInvoices.length
    };
  }
}

export class SupabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Check for Supabase URL and Anon Key from config
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error("Supabase credentials are not set in .env.local");
    }
    
    // Use DATABASE_URL if available, fallback to constructing from Supabase credentials
    const connectionString = config.database.url || 
      `postgres://postgres.${config.supabase.url.replace('https://', '')}:${config.supabase.anonKey}@${config.supabase.url.replace('https://', '')}/postgres`;
    
    neonConfig.fetchFunction = fetch;
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async getClients(search?: string): Promise<Client[]> {
    if (search) {
      const searchTerm = `%${search}%`;
      return this.db.select().from(clients).where(
        or(
          like(clients.name, searchTerm),
          like(clients.email, searchTerm),
          like(clients.company, searchTerm)
        )
      ).orderBy(asc(clients.name));
    }
    return this.db.select().from(clients).orderBy(asc(clients.name));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await this.db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await this.db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await this.db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjects(clientId?: number, status?: string): Promise<Project[]> {
    let query = this.db.select().from(projects);
    
    if (clientId) {
      query = query.where(eq(projects.clientId, clientId));
    }
    
    if (status) {
      query = query.where(eq(projects.status, status));
    }
    
    return query.orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Project Team Member methods
  async getProjectTeamMembers(projectId: number): Promise<ProjectTeamMember[]> {
    return this.db.select().from(projectTeamMembers).where(eq(projectTeamMembers.projectId, projectId));
  }

  async createProjectTeamMember(member: InsertProjectTeamMember): Promise<ProjectTeamMember> {
    const result = await this.db.insert(projectTeamMembers).values(member).returning();
    return result[0];
  }

  async updateProjectTeamMember(id: number, member: Partial<InsertProjectTeamMember>): Promise<ProjectTeamMember | undefined> {
    const result = await this.db.update(projectTeamMembers).set(member).where(eq(projectTeamMembers.id, id)).returning();
    return result[0];
  }

  async deleteProjectTeamMember(id: number): Promise<boolean> {
    const result = await this.db.delete(projectTeamMembers).where(eq(projectTeamMembers.id, id)).returning();
    return result.length > 0;
  }

  // Project Commission methods
  async getProjectCommission(projectId: number): Promise<ProjectCommission | undefined> {
    const result = await this.db.select().from(projectCommissions).where(eq(projectCommissions.projectId, projectId));
    return result[0];
  }

  async createProjectCommission(commission: InsertProjectCommission): Promise<ProjectCommission> {
    const result = await this.db.insert(projectCommissions).values(commission).returning();
    return result[0];
  }

  async updateProjectCommission(id: number, commission: Partial<InsertProjectCommission>): Promise<ProjectCommission | undefined> {
    const result = await this.db.update(projectCommissions).set(commission).where(eq(projectCommissions.id, id)).returning();
    return result[0];
  }

  async deleteProjectCommission(id: number): Promise<boolean> {
    const result = await this.db.delete(projectCommissions).where(eq(projectCommissions.id, id)).returning();
    return result.length > 0;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoices(status?: string): Promise<Invoice[]> {
    let query = this.db.select().from(invoices);
    
    if (status) {
      query = query.where(eq(invoices.status, status));
    }
    
    return query.orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return this.db.select().from(invoices).where(eq(invoices.projectId, projectId));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await this.db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await this.db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  // Invoice Line Item methods
  async getInvoiceLineItems(invoiceId: number): Promise<InvoiceLineItem[]> {
    return this.db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  }

  async createInvoiceLineItem(item: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
    const result = await this.db.insert(invoiceLineItems).values(item).returning();
    return result[0];
  }

  async updateInvoiceLineItem(id: number, item: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem | undefined> {
    const result = await this.db.update(invoiceLineItems).set(item).where(eq(invoiceLineItems.id, id)).returning();
    return result[0];
  }

  async deleteInvoiceLineItem(id: number): Promise<boolean> {
    const result = await this.db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, id)).returning();
    return result.length > 0;
  }

  // Recurring Invoice methods
  async getRecurringInvoice(id: number): Promise<RecurringInvoice | undefined> {
    const result = await this.db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id));
    return result[0];
  }

  async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    return this.db.select().from(recurringInvoices).orderBy(asc(recurringInvoices.nextIssueDate));
  }

  async createRecurringInvoice(recurringInvoice: InsertRecurringInvoice): Promise<RecurringInvoice> {
    const result = await this.db.insert(recurringInvoices).values(recurringInvoice).returning();
    return result[0];
  }

  async updateRecurringInvoice(id: number, recurringInvoice: Partial<InsertRecurringInvoice>): Promise<RecurringInvoice | undefined> {
    const result = await this.db.update(recurringInvoices).set(recurringInvoice).where(eq(recurringInvoices.id, id)).returning();
    return result[0];
  }

  async deleteRecurringInvoice(id: number): Promise<boolean> {
    const result = await this.db.delete(recurringInvoices).where(eq(recurringInvoices.id, id)).returning();
    return result.length > 0;
  }

  // Project Split Summary methods
  async getProjectSplitSummary(projectId: number, invoiceId: number): Promise<ProjectSplitSummary | undefined> {
    const result = await this.db.select().from(projectSplitSummaries).where(
      and(
        eq(projectSplitSummaries.projectId, projectId),
        eq(projectSplitSummaries.invoiceId, invoiceId)
      )
    );
    return result[0];
  }

  async getProjectSplitSummaries(projectId?: number): Promise<ProjectSplitSummary[]> {
    let query = this.db.select().from(projectSplitSummaries);
    
    if (projectId) {
      query = query.where(eq(projectSplitSummaries.projectId, projectId));
    }
    
    return query.orderBy(desc(projectSplitSummaries.createdAt));
  }

  async createProjectSplitSummary(summary: InsertProjectSplitSummary): Promise<ProjectSplitSummary> {
    const result = await this.db.insert(projectSplitSummaries).values(summary).returning();
    return result[0];
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    // Get total revenue from paid invoices
    const totalRevenueResult = await this.db.execute(sql`
      SELECT COALESCE(SUM(total), 0) as total_revenue
      FROM ${invoices}
      WHERE status = 'paid'
    `);
    
    const totalRevenue = totalRevenueResult.rows[0].total_revenue || 0;
    
    // Get pending invoices
    const pendingResult = await this.db.execute(sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount
      FROM ${invoices}
      WHERE status = 'sent'
    `);
    
    const pendingCount = pendingResult.rows[0].count || 0;
    const pendingAmount = pendingResult.rows[0].amount || 0;
    
    // Get overdue invoices
    const overdueResult = await this.db.execute(sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount
      FROM ${invoices}
      WHERE status = 'overdue'
    `);
    
    const overdueCount = overdueResult.rows[0].count || 0;
    const overdueAmount = overdueResult.rows[0].amount || 0;
    
    // Get paid invoices
    const paidResult = await this.db.execute(sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount
      FROM ${invoices}
      WHERE status = 'paid'
    `);
    
    const paidCount = paidResult.rows[0].count || 0;
    const paidAmount = paidResult.rows[0].amount || 0;
    
    return {
      totalRevenue,
      pendingAmount,
      pendingCount,
      overdueAmount,
      overdueCount,
      paidAmount,
      paidCount
    };
  }
}

// Use MemStorage for development and testing until we can connect to Supabase properly
export const storage = new MemStorage();
