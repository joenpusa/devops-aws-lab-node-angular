export interface Material {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  image_key?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: string;
  };
}
