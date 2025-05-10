import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateRevenueSplitPDF, downloadPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { ProjectSplitSummary, Project, Client } from "@shared/schema";

import MainLayout from "@/components/layout/MainLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { PieChart, Eye, Download, Trash2, MoreVertical } from "lucide-react";

export default function RevenueIndex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState<number | null>(null);

  // Fetch split summaries
  const { data: splitSummaries, isLoading: isLoadingSummaries } = useQuery<
    ProjectSplitSummary[]
  >({
    queryKey: ["/api/project-split-summaries"],
  });

  // Fetch projects (for project names)
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Delete split summary mutation (placeholder - API endpoint might not exist)
  const deleteSplitSummary = useMutation({
    mutationFn: async (id: number) => {
      // This API endpoint may not exist - would need to be implemented
      await fetch(`/api/project-split-summaries/${id}`, { method: "DELETE" });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/project-split-summaries"],
      });
      toast({
        title: "Success",
        description: "Revenue split deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete revenue split: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects?.find((p) => p.id === projectId);
    return project ? project.name : `Project #${projectId}`;
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setSummaryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const isLoading = isLoadingSummaries || isLoadingProjects;

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Revenue Sharing</CardTitle>
                <CardDescription>
                  Track revenue distribution across team members and agents
                </CardDescription>
              </div>
              <Link href="/revenue/create">
                <Button>
                  <PieChart className="mr-2 h-4 w-4" />
                  New Revenue Split
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : splitSummaries?.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    No revenue split summaries found
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/revenue/create">Create your first revenue split</Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Team Share</TableHead>
                        <TableHead>Agent Commission</TableHead>
                        <TableHead>Company Profit</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {splitSummaries?.map((summary) => (
                        <TableRow key={summary.id}>
                          <TableCell className="font-medium">
                            {getProjectName(summary.projectId)}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(summary.createdAt),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(summary.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(summary.teamTotal)} (
                            {Math.round(
                              (Number(summary.teamTotal) /
                                Number(summary.totalAmount)) *
                                100
                            )}
                            %)
                          </TableCell>
                          <TableCell>
                            {formatCurrency(summary.commission)} (
                            {Math.round(
                              (Number(summary.commission) /
                                Number(summary.totalAmount)) *
                                100
                            )}
                            %)
                          </TableCell>
                          <TableCell>
                            {formatCurrency(summary.companyProfit)} (
                            {Math.round(
                              (Number(summary.companyProfit) /
                                Number(summary.totalAmount)) *
                                100
                            )}
                            %)
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
                                  <Link href={`/revenue/view?id=${summary.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(summary.id)}
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
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this revenue split? This action
              cannot be undone.
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
                if (summaryToDelete) {
                  deleteSplitSummary.mutate(summaryToDelete);
                }
              }}
              disabled={deleteSplitSummary.isPending}
            >
              {deleteSplitSummary.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
