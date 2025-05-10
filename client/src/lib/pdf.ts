import { Client, Invoice, InvoiceLineItem, Project, ProjectSplitSummary, ProjectTeamMember, ProjectCommission } from "@shared/schema";
import { format } from "date-fns";

// Utility functions for calculating totals
export const calculateSubtotal = (lineItems: InvoiceLineItem[]): number => {
  return lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
};

export const calculateTax = (lineItems: InvoiceLineItem[]): number => {
  return lineItems.reduce((sum, item) => {
    const itemTax = item.tax ? (Number(item.amount) * Number(item.tax)) / 100 : 0;
    return sum + itemTax;
  }, 0);
};

export const calculateTotal = (subtotal: number, tax: number): number => {
  return subtotal + tax;
};

// Generate invoice PDF
export const generateInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  project: Project,
  lineItems: InvoiceLineItem[]
): Promise<Blob> => {
  // This is a placeholder for actual PDF generation
  // In a real implementation, you would use a library like PDFLib or jsPDF
  
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: format(new Date(invoice.issueDate), "yyyy-MM-dd"),
    dueDate: format(new Date(invoice.dueDate), "yyyy-MM-dd"),
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    client: {
      name: client.name,
      email: client.email,
      company: client.company,
      address: client.address
    },
    project: {
      name: project.name,
      description: project.description
    },
    lineItems: lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      tax: item.tax,
      amount: item.amount
    }))
  };
  
  // Convert invoice data to JSON string
  const jsonString = JSON.stringify(invoiceData, null, 2);
  
  // Create a blob from the JSON string (for testing/placeholder)
  // In a real implementation, this would be the generated PDF
  return new Blob([jsonString], { type: "application/pdf" });
};

// Generate revenue split summary PDF
export const generateRevenueSplitPDF = async (
  splitSummary: ProjectSplitSummary,
  project: Project,
  teamMembers: ProjectTeamMember[],
  commission?: ProjectCommission,
  client?: Client
): Promise<Blob> => {
  // This is a placeholder for actual PDF generation
  
  const splitData = {
    project: {
      name: project.name,
      client: client ? client.name : "N/A",
    },
    totalAmount: splitSummary.totalAmount,
    teamTotal: splitSummary.teamTotal,
    commission: splitSummary.commission,
    companyProfit: splitSummary.companyProfit,
    teamMembers: teamMembers.map(member => ({
      role: member.role,
      contribution: member.contribution,
      contributionType: member.contributionType,
      amount: member.contributionType === "percentage" 
        ? (Number(splitSummary.totalAmount) * Number(member.contribution)) / 100
        : Number(member.contribution)
    })),
    agent: commission ? {
      name: commission.agentName,
      rate: commission.rate,
      amount: splitSummary.commission
    } : null
  };
  
  // Convert split data to JSON string
  const jsonString = JSON.stringify(splitData, null, 2);
  
  // Create a blob from the JSON string (for testing/placeholder)
  return new Blob([jsonString], { type: "application/pdf" });
};

// Download the PDF
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
