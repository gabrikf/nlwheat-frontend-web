import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
};

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  };
};

export const AuthContext = createContext({} as AuthContextData);

type AuthProvider = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=1d52b33f97ad34c71158`;
  async function signIn(code: string) {
    const response = await api.post<AuthResponse>("authenticate", {
      code,
    });

    const { token, user } = response.data;

    localStorage.setItem("@userAuthenticatedToken", token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem("@userAuthenticatedToken");
  }
  useEffect(() => {
    const token = localStorage.getItem("@userAuthenticatedToken");

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      api.get<User>("profile").then((response) => {
        setUser(response.data);
      });
    }
  }, []);
  useEffect(() => {
    const url = window.location.href;
    const hasCodeIncludInUrl = url.includes("?code=");
    if (hasCodeIncludInUrl) {
      const [urlWithoutCode, code] = url.split("?code=");
      window.history.pushState({}, "", urlWithoutCode);

      signIn(code);
    }
  }, []);
  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
