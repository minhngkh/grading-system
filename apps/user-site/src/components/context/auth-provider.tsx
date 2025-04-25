import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import React from "react";

export interface AuthContextProps {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  user: string | null;
}

const AuthContext = React.createContext<AuthContextProps | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerkAuth();

  const isAuthenticated = !!user;

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext
      value={{
        isAuthenticated,
        user: user?.id ?? null,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = React.use(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
