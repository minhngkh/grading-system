import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import React from "react";

export interface AuthContext {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  user: string | null;
}

const AuthContext = React.createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerkAuth();

  const isAuthenticated = !!user;

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: user?.id ?? null,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
