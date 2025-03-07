export interface Tool {
    _id: string;
    name: string;
    category: string;
    link?: string;
    description: string;
    user?: string;
    createdAt: string;
  }
  
  export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (username: string, email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
  } 