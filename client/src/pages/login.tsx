import AuthForm from "@/components/auth/AuthForm";
import { useIsAuthenticated } from "@/lib/auth";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const [_, setLocation] = useLocation();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthForm initialTab="login" />
    </div>
  );
}
