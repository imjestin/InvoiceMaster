import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateRevenueSplitPDF, downloadPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import {
  ProjectSplitSummary,
  Project,
  ProjectTeamMember,
  ProjectCommission,
  Client,
} from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Send,
  Calendar,
  DollarSign,
  Users,
  User,
  Building,
} from "lucide-react";

interface RevenueSplitDetailProps {
  splitId: number;
}

export default function RevenueSplitDetail({ splitId }: RevenueSplitDetailProps) {
  const { toast } = useToast();
  const [splitData, setSplitData] = useState<{
    summary: ProjectSplitSummary;
    project: Project;
    client: Client;
    teamMembers: ProjectTeamMember[];
    commission?: ProjectCommission;
  } | null>(null);

  // Fetch split summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery<ProjectSplitSummary>({
    queryKey: [`/api/project-split-summaries/${splitId}`],
    queryFn: async () => {
      const response = await fetch(`/api/project-split-summaries`);
      if (!response.ok) {
        throw new Error("Failed to fetch split summary");
      }
      const summaries = await response.json();
      return summaries.find((s: ProjectSplitSummary) => s.id === splitId);
    },
  });

  // When summary is loaded, fetch related data
  useEffect(() => {
    if (summary) {
      const fetchRelatedData = async () => {
        try {
          // Fetch project
          const projectResponse = await fetch(`/api/projects/${summary.projectId}`);
          if (!projectResponse.ok) throw new Error("Failed to fetch project");
          const project = await projectResponse.json();

          // Fetch client
          const clientResponse = await fetch(`/api/clients/${project.clientId}`);
          if (!clientResponse.ok) throw new Error("Failed to fetch client");
          const client = await clientResponse.json();

          // Fetch team members
          const teamMembersResponse = await fetch(
            `/api/projects/${summary.projectId}/team-members`
          );
          if (!teamMembersResponse.ok)
            throw new Error("Failed to fetch team members");
          const teamMembers = await teamMembersResponse.json();

          // Fetch commission (if exists)
          let commission;
          try {
            const commissionResponse = await fetch(
              `/api/projects/${summary.projectId}/commission`
            );
            if (commissionResponse.ok) {
              commission = await commissionResponse.json();
            }
          } catch (error) {
            // Commission might not exist, ignore error
          }

          setSplitData({
            summary,
            project,
            client,
            teamMembers,
            commission,
          });
        } catch (error) {
          console.error("Error fetching related data:", error);
          toast({
            title: "Error",
            description: "Failed to load complete revenue split data",
            variant: "destructive",
          });
        }
      };

      fetchRelatedData();
    }
  }, [summary, toast]);

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

  // Calculate percentage
  const calculatePercentage = (amount: number, total: number) => {
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!splitData) return;

    try {
      const pdfBlob = await generateRevenueSplitPDF(
        splitData.summary,
        splitData.project,
        splitData.teamMembers,
        splitData.commission,
        splitData.client
      );
      
      downloadPDF(
        pdfBlob,
        `RevenueSplit-${splitData.project.name}-${format(
          new Date(splitData.summary.createdAt),
          "yyyy-MM-dd"
        )}.pdf`
      );

      toast({
        title: "Success",
        description: "Revenue split PDF generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // Send by email (placeholder)
  const handleSendEmail = () => {
    toast({
      title: "Not Implemented",
      description: "Email functionality is not implemented in this demo",
    });
  };

  if (isLoadingSummary || (summary && !splitData)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Revenue split not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/revenue">Back to Revenue Splits</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/revenue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Revenue Splits
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSendEmail}>
            <Send className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {splitData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Revenue Split Summary</CardTitle>
              <CardDescription>
                Project: {splitData.project.name} | Client:{" "}
                {splitData.client.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      Created on{" "}
                      {format(
                        new Date(splitData.summary.createdAt),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      Total Invoice Amount:{" "}
                      <span className="font-semibold text-black">
                        {formatCurrency(splitData.summary.totalAmount)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-3">Revenue Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team Members:</span>
                      <span className="font-medium">
                        {formatCurrency(splitData.summary.teamTotal)} (
                        {calculatePercentage(
                          Number(splitData.summary.teamTotal),
                          Number(splitData.summary.totalAmount)
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Commission:</span>
                      <span className="font-medium">
                        {formatCurrency(splitData.summary.commission)} (
                        {calculatePercentage(
                          Number(splitData.summary.commission),
                          Number(splitData.summary.totalAmount)
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company Profit:</span>
                      <span className="font-medium">
                        {formatCurrency(splitData.summary.companyProfit)} (
                        {calculatePercentage(
                          Number(splitData.summary.companyProfit),
                          Number(splitData.summary.totalAmount)
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Members */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {splitData.teamMembers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No team members assigned
                  </p>
                ) : (
                  <div className="space-y-4">
                    {splitData.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{member.role}</p>
                          <p className="text-sm text-gray-500">
                            {member.contributionType === "percentage"
                              ? `${member.contribution}% of total`
                              : `Fixed: ${formatCurrency(member.contribution)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              member.contributionType === "percentage"
                                ? (Number(splitData.summary.totalAmount) *
                                    Number(member.contribution)) /
                                    100
                                : Number(member.contribution)
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent and Company */}
            <div className="space-y-6">
              {/* Agent Commission */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-amber-500" />
                    <CardTitle className="text-lg">Agent Commission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {splitData.commission ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{splitData.commission.agentName}</p>
                        <p className="text-sm text-gray-500">
                          {splitData.commission.rate}% commission rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(splitData.summary.commission)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No agent commission for this project
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Company Profit */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-green-500" />
                    <CardTitle className="text-lg">Company Profit</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">SkillyVoice</p>
                      <p className="text-sm text-gray-500">
                        {calculatePercentage(
                          Number(splitData.summary.companyProfit),
                          Number(splitData.summary.totalAmount)
                        )}
                        % of total invoice
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(splitData.summary.companyProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
