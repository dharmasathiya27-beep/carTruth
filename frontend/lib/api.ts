import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  colour: string;
  fuel_type: string;
  engine_size?: number;
  registration: string;
  tax_status: string;
  tax_due_date?: string;
}

export interface MOTRecord {
  test_date: string;
  result: string;
  mileage?: number;
  defects: string[];
}

export interface MileageRecord {
  date: string;
  mileage: number;
}

export interface OwnershipScore {
  score: number;
  summary: string;
  what_looks_good: string;
  potential_problems: string;
  expected_yearly_cost: string;
  should_buy_recommendation: string;
}

export interface VehicleReport {
  vehicle: VehicleDetails;
  current_mot_status: string;
  mot_valid_until?: string;
  mot_history: MOTRecord[];
  mileage_history: MileageRecord[];
  ownership_score: OwnershipScore;
}

export const searchVehicle = async (registration: string): Promise<VehicleReport> => {
  try {
    const response = await apiClient.post<VehicleReport>('/api/vehicle/search', {
      registration,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(error.response.data.detail || 'Vehicle not found');
    }
    throw new Error(error.message || 'Failed to search vehicle');
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/api/vehicle/health');
    return true;
  } catch {
    return false;
  }
};
