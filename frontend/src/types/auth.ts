
export interface JwtPayload {
  sub: string;
  role: string;
  full_name: string;
  department: string;
  exp: number;
}

export interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  loading: boolean;
  user: { username: string; role: string; full_name: string; department: string } | null;
  isAuthenticated: boolean;
}