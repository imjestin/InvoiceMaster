import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSplitSummarySchema } from "@shared/schema";
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
  FormDescription,
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

// Define custom type for the form
const revenueSplitFormSchema = z.object({
  projectId: z.number(),
  invoiceId: z.number(),
  totalAmount: z.number().min(0.01, "Amount must be greater than 0"),
  teamMembers: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      role: z.string().min(1, "Role is required"),
      contributionType: z.enum(["percentage", "fixed"]),
      contribution: z.number().min(0.01, "Contribution must be greater than 0"),
    })
  ),
  agent: z.object({
    name: z.string(),
    rate: z.number().min(0).max(100, "Rate must be between 0 and 100"),
    hasAgent: z.boolean(),
  }),
  companyProfitPercentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
});

type RevenueSplitFormValues = z.infer<typeof revenueSplitFormSchema>;

interface RevenueSplitFormProps {
  initialProjectId?: number;
  initialInvoiceId?: number;
}

export default function RevenueSplitForm({ initialProjectId, initialInvoiceId }: RevenueSplitFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedSummary, setCalculatedSummary] = useState({
    teamTotal: 0,
    commission: 0,
    companyProfit: 0,
  });

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch invoices for the selected project
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: [`/api/projects/${form?.getValues().projectId}/invoices`],
    enabled: !!form?.getValues().projectId,
  });

  // Form setup
  const form = useForm<RevenueSplitFormValues>({
    resolver: zodResolver(revenueSplitFormSchema),
    defaultValues: {
      projectId: initialProjectId || 0,
      invoiceId: initialInvoiceId || 0,
      totalAmount: 0,
      teamMembers: [
        {
          name: "",
          role: "",
          contributionType: "percentage",
          contribution: 0,
        },
      ],
      agent: {
        name: "",
        rate: 0,
        hasAgent: false,
      },
      companyProfitPercentage: 25, // Default company profit percentage
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "teamMembers",
    control: form.control,
  });

  // When project changes, update invoices dropdown
  useEffect(() => {
    const projectId = form.getValues().projectId;
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/invoices`] });
      form.setValue("invoiceId", 0); // Reset invoice selection
    }
  }, [form.watch("projectId"), queryClient]);

  // When invoice changes, fetch invoice amount
  useEffect(() => {
    const fetchInvoiceAmount = async () => {
      const invoiceId = form.getValues().invoiceId;
      if (invoiceId) {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}`);
          if (response.ok) {
            const invoice = await response.json();
            form.setValue("totalAmount", Number(invoice.total));
            calculateSplit();
          }
        } catch (error) {
          console.error("Failed to fetch invoice amount:", error);
        }
      }
    };

    fetchInvoiceAmount();
  }, [form.watch("invoiceId")]);

  // Calculate revenue split whenever relevant values change
  useEffect(() => {
    calculateSplit();
  }, [
    form.watch("totalAmount"),
    form.watch("teamMembers"),
    form.watch("agent"),
    form.watch("companyProfitPercentage"),
  ]);

  // Calculate the revenue split
  const calculateSplit = () => {
    const values = form.getValues();
    const totalAmount = Number(values.totalAmount);
    
    if (!totalAmount) return;

    let teamTotal = 0;
    
    // Calculate team member totals
    values.teamMembers.forEach(member => {
      if (member.contributionType === "percentage") {
        teamTotal += (totalAmount * Number(member.contribution)) / 100;
      } else {
        teamTotal += Number(member.contribution);
      }
    });

    // Calculate agent commission
    const commission = values.agent.hasAgent
      ? (totalAmount * Number(values.agent.rate)) / 100
      : 0;

    // Calculate company profit
    let companyProfit = (totalAmount * Number(values.companyProfitPercentage)) / 100;

    // Adjust if the total exceeds the invoice amount
    const total = teamTotal + commission + companyProfit;
    if (total > totalAmount) {
      companyProfit = totalAmount - teamTotal - commission;
    }

    setCalculatedSummary({
      teamTotal,
      commission,
      companyProfit,
    });
  };

  // Create split summary mutation
  const createSplitSummary = useMutation({
    mutationFn: async (values: RevenueSplitFormValues) => {
      // Prepare data for API
      const splitSummaryData = {
        projectId: values.projectId,
        invoiceId: values.invoiceId,
        totalAmount: values.totalAmount,
        teamTotal: calculatedSummary.teamTotal,
        commission: calculatedSummary.commission,
        companyProfit: calculatedSummary.companyProfit,
      };

      // Create project split summary
      const response = await apiRequest(
        "POST",
        "/api/project-split-summaries",
        splitSummaryData
      );
      const summary = await response.json();

      // Create team members
      for (const member of values.teamMembers) {
        await apiRequest("POST", `/api/projects/${values.projectId}/team-members`, {
          projectId: values.projectId,
          userId: 1, // Assuming a placeholder user ID
          role: member.role,
          contribution: member.contribution,
          contributionType: member.contributionType,
        });
      }

      // Create commission if there's an agent
      if (values.agent.hasAgent) {
        await apiRequest("POST", `/api/projects/${values.projectId}/commission`, {
          projectId: values.projectId,
          agentName: values.agent.name,
          rate: values.agent.rate,
        });
      }

      return summary;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-split-summaries"] });
      toast({
        title: "Success",
        description: "Revenue split created successfully",
      });
      navigate(`/revenue/view?id=${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create revenue split: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: RevenueSplitFormValues) => {
    createSplitSummary.mutate(values);
  };

  // Add team member
  const addTeamMember = () => {
    append({
      name: "",
      role: "",
      contributionType: "percentage",
      contribution: 0,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Toggle agent
  const toggleAgent = (hasAgent: boolean) => {
    form.setValue("agent.hasAgent", hasAgent);
    if (!hasAgent) {
      form.setValue("agent.name", "");
      form.setValue("agent.rate", 0);
    }
  };

  if (isLoadingProjects) {
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
          {/* Project */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project*</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
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

          {/* Invoice */}
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice*</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                  disabled={!form.getValues().projectId || isLoadingInvoices}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {invoices?.map((invoice) => (
                      <SelectItem
                        key={invoice.id}
                        value={invoice.id.toString()}
                      >
                        {invoice.invoiceNumber} - {formatCurrency(Number(invoice.total))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a project first to see available invoices
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount*</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>
                  This is automatically filled when an invoice is selected
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company Profit Percentage */}
          <FormField
            control={form.control}
            name="companyProfitPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Profit Percentage*</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    max="100"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>
                  Default company profit percentage is 25%
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Team Members</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-4 md:grid-cols-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Developer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contribution Type */}
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.contributionType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contribution */}
                  <div className="flex items-end space-x-2">
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.contribution`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>
                            {form.watch(`teamMembers.${index}.contributionType`) === "percentage"
                              ? "Percentage"
                              : "Amount"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step={
                                form.watch(`teamMembers.${index}.contributionType`) === "percentage"
                                  ? "1"
                                  : "0.01"
                              }
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value));
                                calculateSplit();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        remove(index);
                        calculateSplit();
                      }}
                      disabled={fields.length === 1}
                      className="mb-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Agent Commission */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Agent Commission</h3>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={form.watch("agent.hasAgent") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAgent(true)}
              >
                Has Agent
              </Button>
              <Button
                type="button"
                variant={!form.watch("agent.hasAgent") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAgent(false)}
              >
                No Agent
              </Button>
            </div>
          </div>

          {form.watch("agent.hasAgent") && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Agent Name */}
                  <FormField
                    control={form.control}
                    name="agent.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jane Smith" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Agent Rate */}
                  <FormField
                    control={form.control}
                    name="agent.rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                              calculateSplit();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue Split Summary */}
        {form.getValues().totalAmount > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Revenue Split Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Invoice Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(form.getValues().totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Team Members Total:</span>
                  <span className="font-medium">
                    {formatCurrency(calculatedSummary.teamTotal)} (
                    {form.getValues().totalAmount
                      ? Math.round(
                          (calculatedSummary.teamTotal / form.getValues().totalAmount) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Agent Commission:</span>
                  <span className="font-medium">
                    {formatCurrency(calculatedSummary.commission)} (
                    {form.getValues().totalAmount
                      ? Math.round(
                          (calculatedSummary.commission / form.getValues().totalAmount) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Company Profit:</span>
                  <span className="font-medium">
                    {formatCurrency(calculatedSummary.companyProfit)} (
                    {form.getValues().totalAmount
                      ? Math.round(
                          (calculatedSummary.companyProfit / form.getValues().totalAmount) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/revenue")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createSplitSummary.isPending}
          >
            {createSplitSummary.isPending
              ? "Creating..."
              : "Create Revenue Split"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
