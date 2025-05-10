import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertClientSchema, 
  insertProjectSchema, 
  insertProjectTeamMemberSchema,
  insertProjectCommissionSchema,
  insertInvoiceSchema,
  insertInvoiceLineItemSchema,
  insertRecurringInvoiceSchema,
  insertProjectSplitSummarySchema
} from "@shared/schema";

import { createServerClient } from "./utils/supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Add a route demonstrating the App Router pattern with Supabase
  app.get("/api/supabase-todos", async (req, res) => {
    try {
      // Get cookies (or any auth header) from request
      const cookieHeader = req.headers.cookie;
      
      // Create a Supabase client using the App Router pattern
      const supabase = createServerClient(cookieHeader);
      
      // Query data from Supabase
      const { data: todos, error } = await supabase.from('todos').select('*');
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.json(todos || []);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // User routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const clients = await storage.getClients(search);
      return res.status(200).json(clients);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(200).json(client);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      return res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(200).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const deleted = await storage.deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      if (clientId !== undefined && isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const projects = await storage.getProjects(clientId, status);
      return res.status(200).json(projects);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      return res.status(200).json(project);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      return res.status(200).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const deleted = await storage.deleteProject(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project Team Members routes
  app.get("/api/projects/:projectId/team-members", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const teamMembers = await storage.getProjectTeamMembers(projectId);
      return res.status(200).json(teamMembers);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects/:projectId/team-members", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const teamMemberData = insertProjectTeamMemberSchema.parse({ ...req.body, projectId });
      const teamMember = await storage.createProjectTeamMember(teamMemberData);
      return res.status(201).json(teamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/project-team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }
      
      const teamMemberData = insertProjectTeamMemberSchema.partial().parse(req.body);
      const teamMember = await storage.updateProjectTeamMember(id, teamMemberData);
      
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      return res.status(200).json(teamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/project-team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }
      
      const deleted = await storage.deleteProjectTeamMember(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project Commission routes
  app.get("/api/projects/:projectId/commission", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const commission = await storage.getProjectCommission(projectId);
      
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.status(200).json(commission);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects/:projectId/commission", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if commission already exists
      const existingCommission = await storage.getProjectCommission(projectId);
      if (existingCommission) {
        return res.status(409).json({ message: "Commission for this project already exists" });
      }
      
      const commissionData = insertProjectCommissionSchema.parse({ ...req.body, projectId });
      const commission = await storage.createProjectCommission(commissionData);
      return res.status(201).json(commission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/project-commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      
      const commissionData = insertProjectCommissionSchema.partial().parse(req.body);
      const commission = await storage.updateProjectCommission(id, commissionData);
      
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.status(200).json(commission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/project-commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      
      const deleted = await storage.deleteProjectCommission(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const invoices = await storage.getInvoices(status);
      return res.status(200).json(invoices);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:projectId/invoices", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const invoices = await storage.getInvoicesByProject(projectId);
      return res.status(200).json(invoices);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      return res.status(200).json(invoice);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      return res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, invoiceData);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      return res.status(200).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const deleted = await storage.deleteInvoice(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice Line Item routes
  app.get("/api/invoices/:invoiceId/line-items", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const lineItems = await storage.getInvoiceLineItems(invoiceId);
      return res.status(200).json(lineItems);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices/:invoiceId/line-items", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const lineItemData = insertInvoiceLineItemSchema.parse({ ...req.body, invoiceId });
      const lineItem = await storage.createInvoiceLineItem(lineItemData);
      return res.status(201).json(lineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/invoice-line-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }
      
      const lineItemData = insertInvoiceLineItemSchema.partial().parse(req.body);
      const lineItem = await storage.updateInvoiceLineItem(id, lineItemData);
      
      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }
      
      return res.status(200).json(lineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/invoice-line-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }
      
      const deleted = await storage.deleteInvoiceLineItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Line item not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recurring Invoice routes
  app.get("/api/recurring-invoices", async (req, res) => {
    try {
      const recurringInvoices = await storage.getRecurringInvoices();
      return res.status(200).json(recurringInvoices);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/recurring-invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recurring invoice ID" });
      }
      
      const recurringInvoice = await storage.getRecurringInvoice(id);
      
      if (!recurringInvoice) {
        return res.status(404).json({ message: "Recurring invoice not found" });
      }
      
      return res.status(200).json(recurringInvoice);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/recurring-invoices", async (req, res) => {
    try {
      const recurringInvoiceData = insertRecurringInvoiceSchema.parse(req.body);
      const recurringInvoice = await storage.createRecurringInvoice(recurringInvoiceData);
      return res.status(201).json(recurringInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/recurring-invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recurring invoice ID" });
      }
      
      const recurringInvoiceData = insertRecurringInvoiceSchema.partial().parse(req.body);
      const recurringInvoice = await storage.updateRecurringInvoice(id, recurringInvoiceData);
      
      if (!recurringInvoice) {
        return res.status(404).json({ message: "Recurring invoice not found" });
      }
      
      return res.status(200).json(recurringInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/recurring-invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recurring invoice ID" });
      }
      
      const deleted = await storage.deleteRecurringInvoice(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recurring invoice not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project Split Summary routes
  app.get("/api/project-split-summaries", async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      if (projectId !== undefined && isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const splitSummaries = await storage.getProjectSplitSummaries(projectId);
      return res.status(200).json(splitSummaries);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:projectId/invoices/:invoiceId/split-summary", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const invoiceId = parseInt(req.params.invoiceId);
      
      if (isNaN(projectId) || isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const splitSummary = await storage.getProjectSplitSummary(projectId, invoiceId);
      
      if (!splitSummary) {
        return res.status(404).json({ message: "Split summary not found" });
      }
      
      return res.status(200).json(splitSummary);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/project-split-summaries", async (req, res) => {
    try {
      const splitSummaryData = insertProjectSplitSummarySchema.parse(req.body);
      const splitSummary = await storage.createProjectSplitSummary(splitSummaryData);
      return res.status(201).json(splitSummary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
