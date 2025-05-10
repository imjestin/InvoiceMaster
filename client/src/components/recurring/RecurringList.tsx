import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RecurringInvoice } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, MoreVertical, RotateCw } from "lucide-react";

export default function RecurringList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<number | null>(null);

  // Fetch recurring invoices
  const { data: recurringInvoices, isLoading } = useQuery<RecurringInvoice[]>({
    queryKey: ["/api/recurring-invoices"],
  });

  // Delete recurring invoice mutation
  const deleteRecurring = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recurring-invoices/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-invoices"] });
      toast({
        title: "Success",
        description: "Recurring invoice deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete recurring invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle enabled status mutation
  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const response = await apiRequest("PUT", `/api/recurring-invoices/${id}`, {
        enabled,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-invoices"] });
      toast({
        title: "Success",
        description: "Recurring invoice status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete recurring invoice
  const handleDeleteRecurring = (id: number) => {
    setRecurringToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle toggle enabled status
  const handleToggleEnabled = (id: number, currentEnabled: boolean) => {
    toggleEnabled.mutate({ id, enabled: !currentEnabled });
  };

  // Format frequency for display
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      default:
        return frequency;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Recurring Invoices</CardTitle>
            <CardDescription>
              Manage your automatically generated invoices
            </CardDescription>
          </div>
          <Link href="/recurring/new">
            <Button>
              <RotateCw className="mr-2 h-4 w-4" />
              New Recurring Invoice
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recurringInvoices?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No recurring invoices found</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/recurring/new">Create your first recurring invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Issue Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringInvoices?.map((recurring) => (
                    <TableRow key={recurring.id}>
                      <TableCell className="font-medium">
                        Project ID: {recurring.projectId}
                      </TableCell>
                      <TableCell>{formatFrequency(recurring.frequency)}</TableCell>
                      <TableCell>
                        {format(new Date(recurring.nextIssueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={recurring.enabled}
                            onCheckedChange={() =>
                              handleToggleEnabled(recurring.id, recurring.enabled)
                            }
                          />
                          <Badge variant={recurring.enabled ? "default" : "secondary"}>
                            {recurring.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/recurring/edit?id=${recurring.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRecurring(recurring.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recurring invoice? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (recurringToDelete) {
                  deleteRecurring.mutate(recurringToDelete);
                }
              }}
              disabled={deleteRecurring.isPending}
            >
              {deleteRecurring.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
