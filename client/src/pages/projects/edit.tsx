import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ProjectForm from "@/components/projects/ProjectForm";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProject() {
  const [location] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);

  // Extract project ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("id");
    setProjectId(id ? parseInt(id) : null);
  }, [location]);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
              <CardDescription>
                Update project details, status, and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectId ? (
                <ProjectForm projectId={projectId} />
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
