import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertInvoiceSchema, insertInvoiceLineItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const invoiceFormSchema = insertInvoiceSchema.extend({
  lineItems: z.array(
    insertInvoiceLineItemSchema.omit({ id: true, invoiceId: true })
  )
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoiceId?: number;
}

export default function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!!invoiceId);

  // Fetch clients for dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch invoice data if editing
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Fetch line items if editing
  const { data: lineItems, isLoading: isLoadingLineItems } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/line-items`],
    enabled: !!invoiceId,
  });

  // Form setup
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(
        Math.floor(1000 + Math.random() * 9000)
      )}`,
      projectId: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      status: "draft",
      notes: "",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: [
        {
          description: "",
          quantity: 1,
          rate: 0,
          tax: 0,
          amount: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "lineItems",
    control: form.control,
  });

  // Set form values when editing and data is loaded
  useEffect(() => {
    if (invoice && lineItems && isEditing) {
      const formattedInvoice = {
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          tax: Number(item.tax) || 0,
          amount: Number(item.amount),
        })),
      };
      form.reset(formattedInvoice);
    }
  }, [invoice, lineItems, isEditing, form]);

  // Calculate line item amount when quantity or rate changes
  const calculateLineItemAmount = (index: number) => {
    const quantity = form.getValues(`lineItems.${index}.quantity`);
    const rate = form.getValues(`lineItems.${index}.rate`);
    const amount = Number(quantity) * Number(rate);
    form.setValue(`lineItems.${index}.amount`, amount);
    updateTotals();
  };

  // Update invoice totals
  const updateTotals = () => {
    const lineItems = form.getValues("lineItems");
    let subtotal = 0;
    let taxAmount = 0;

    lineItems.forEach((item) => {
      const itemAmount = Number(item.amount);
      subtotal += itemAmount;
      if (item.tax) {
        taxAmount += (itemAmount * Number(item.tax)) / 100;
      }
    });

    const total = subtotal + taxAmount;

    form.setValue("subtotal", subtotal);
    form.setValue("tax", taxAmount);
    form.setValue("total", total);
  };

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        projectId: data.projectId,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        status: data.status,
        notes: data.notes,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paidDate: data.paidDate,
      };

      const response = await apiRequest("POST", "/api/invoices", invoiceData);
      const invoice = await response.json();

      // Create line items
      for (const item of data.lineItems) {
        await apiRequest("POST", `/api/invoices/${invoice.id}/line-items`, {
          ...item,
          invoiceId: invoice.id,
        });
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
      navigate("/invoices");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoice = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        projectId: data.projectId,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        status: data.status,
        notes: data.notes,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paidDate: data.paidDate,
      };

      await apiRequest("PUT", `/api/invoices/${invoiceId}`, invoiceData);

      // Fetch existing line items
      const existingLineItems = await (
        await apiRequest("GET", `/api/invoices/${invoiceId}/line-items`)
      ).json();

      // Delete existing line items
      for (const item of existingLineItems) {
        await apiRequest("DELETE", `/api/invoice-line-items/${item.id}`);
      }

      // Create new line items
      for (const item of data.lineItems) {
        await apiRequest("POST", `/api/invoices/${invoiceId}/line-items`, {
          ...item,
          invoiceId,
        });
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/invoices/${invoiceId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/invoices/${invoiceId}/line-items`],
      });
      toast({
        title: "Success",
        description: "Invoice updated successfully.",
      });
      navigate("/invoices");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: InvoiceFormValues) => {
    if (isEditing) {
      updateInvoice.mutate(values);
    } else {
      createInvoice.mutate(values);
    }
  };

  // Add line item
  const addLineItem = () => {
    append({
      description: "",
      quantity: 1,
      rate: 0,
      tax: 0,
      amount: 0,
    });
  };

  // Loading state
  if (
    (isEditing && (isLoadingInvoice || isLoadingLineItems)) ||
    isLoadingClients ||
    isLoadingProjects
  ) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Invoice Number */}
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly={isEditing}
                    className={isEditing ? "bg-gray-100" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Project */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Issue Date */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Paid Date (only shown when status is paid) */}
          {form.watch("status") === "paid" && (
            <FormField
              control={form.control}
              name="paidDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Paid Date</FormLabel>
                  <DatePicker
                    date={field.value || new Date()}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax (%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="relative px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="px-4 py-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Description"
                                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    placeholder="1"
                                    min="1"
                                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      calculateLineItemAmount(index);
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      calculateLineItemAmount(index);
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.tax`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      updateTotals();
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    placeholder="0.00"
                                    readOnly
                                    className="border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              remove(index);
                              updateTotals();
                            }}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-900 font-medium">
                  ${form.watch("subtotal").toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500">Tax:</span>
                <span className="text-gray-900 font-medium">
                  ${form.watch("tax").toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm font-medium">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">
                  ${form.watch("total").toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes or payment instructions..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/invoices")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createInvoice.isPending || updateInvoice.isPending}
          >
            {createInvoice.isPending || updateInvoice.isPending ? (
              "Saving..."
            ) : isEditing ? (
              "Update Invoice"
            ) : (
              "Create Invoice"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
