import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRecurringInvoiceSchema } from "@shared/schema";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// Extend the recurring invoice schema for validation
const recurringFormSchema = insertRecurringInvoiceSchema.extend({
  nextIssueDate: z.date(),
  templateNotes: z.string().optional(),
});

type RecurringFormValues = z.infer<typeof recurringFormSchema>;

interface RecurringFormProps {
  recurringId?: number;
}

export default function RecurringForm({ recurringId }: RecurringFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!recurringId;

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch recurring invoice if editing
  const { data: recurringInvoice, isLoading: isLoadingRecurring } = useQuery({
    queryKey: [`/api/recurring-invoices/${recurringId}`],
    enabled: !!recurringId,
  });

  // Form setup
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      projectId: 0,
      frequency: "monthly",
      nextIssueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      enabled: true,
      template: {}, // This will be populated from an existing invoice or template
      templateNotes: "",
    },
  });

  // Update form values when recurring invoice data is loaded
  useEffect(() => {
    if (recurringInvoice && isEditing) {
      const formData = {
        ...recurringInvoice,
        nextIssueDate: new Date(recurringInvoice.nextIssueDate),
        templateNotes: recurringInvoice.template.notes || "",
      };
      form.reset(formData);
    }
  }, [recurringInvoice, form, isEditing]);

  // Create recurring invoice mutation
  const createRecurring = useMutation({
    mutationFn: async (data: RecurringFormValues) => {
      // Prepare template data - in a real implementation, this would be more complex
      const templateData = {
        ...data.template,
        notes: data.templateNotes,
      };

      const recurringData = {
        projectId: data.projectId,
        frequency: data.frequency,
        nextIssueDate: data.nextIssueDate,
        enabled: data.enabled,
        lastInvoiceId: data.lastInvoiceId || null,
        template: templateData,
      };

      const response = await apiRequest("POST", "/api/recurring-invoices", recurringData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-invoices"] });
      toast({
        title: "Success",
        description: "Recurring invoice created successfully",
      });
      navigate("/recurring");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create recurring invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update recurring invoice mutation
  const updateRecurring = useMutation({
    mutationFn: async (data: RecurringFormValues) => {
      // Prepare template data
      const templateData = {
        ...data.template,
        notes: data.templateNotes,
      };

      const recurringData = {
        projectId: data.projectId,
        frequency: data.frequency,
        nextIssueDate: data.nextIssueDate,
        enabled: data.enabled,
        lastInvoiceId: data.lastInvoiceId || null,
        template: templateData,
      };

      const response = await apiRequest("PUT", `/api/recurring-invoices/${recurringId}`, recurringData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-invoices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/recurring-invoices/${recurringId}`] });
      toast({
        title: "Success",
        description: "Recurring invoice updated successfully",
      });
      navigate("/recurring");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update recurring invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: RecurringFormValues) => {
    if (isEditing) {
      updateRecurring.mutate(values);
    } else {
      createRecurring.mutate(values);
    }
  };

  if ((isLoadingRecurring && isEditing) || isLoadingProjects) {
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

          {/* Frequency */}
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Next Issue Date */}
          <FormField
            control={form.control}
            name="nextIssueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Next Issue Date*</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Enabled */}
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enabled</FormLabel>
                  <FormDescription>
                    Enable automatic generation of invoices
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Template Notes */}
        <FormField
          control={form.control}
          name="templateNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Template Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notes to include on each generated invoice..."
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                These notes will be included on every invoice generated from this recurring template.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/recurring")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createRecurring.isPending || updateRecurring.isPending}
          >
            {createRecurring.isPending || updateRecurring.isPending
              ? "Saving..."
              : isEditing
              ? "Update Recurring Invoice"
              : "Create Recurring Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
