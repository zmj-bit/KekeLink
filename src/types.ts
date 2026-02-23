export type UserRole = 'passenger' | 'driver' | 'admin';

export interface User {
  id: number;
  role: UserRole;
  name: string;
  phone: string;
  nin?: string;
  address?: string;
  dob?: string;
  next_of_kin?: string;
  photo_url?: string;
  is_verified: boolean;
  student_id?: string;
  student_expiry?: string;
}

export interface Keke {
  id: number;
  unique_number: string;
  owner_id: number;
  current_driver_id?: number;
}

export interface Trip {
  id: number;
  passenger_id: number;
  driver_id: number;
  keke_id: number;
  start_lat: number;
  start_lng: number;
  end_lat?: number;
  end_lng?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  fare?: number;
  created_at: string;
}
