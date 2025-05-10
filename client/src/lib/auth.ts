import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

// Local storage keys
const USER_KEY = "skillyvoice_user";

/**
 * Login user
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const user = await response.json();
      
      // Store user in local storage
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    },
    onSuccess: () => {
      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });
};

/**
 * Register user
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const user = await response.json();
      
      // Store user in local storage
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    },
    onSuccess: () => {
      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });
};

/**
 * Logout user
 */
export const logout = () => {
  // Remove user from local storage
  localStorage.removeItem(USER_KEY);
  // Invalidate user query
  queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
};

/**
 * Get current user
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => {
      // Get user from local storage
      const user = localStorage.getItem(USER_KEY);
      
      if (!user) {
        return null;
      }
      
      try {
        return JSON.parse(user) as User;
      } catch (error) {
        localStorage.removeItem(USER_KEY);
        return null;
      }
    }
  });
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useCurrentUser();
  return { isAuthenticated: !!user, user, isLoading };
};
