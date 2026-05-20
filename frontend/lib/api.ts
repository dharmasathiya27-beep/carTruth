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
  engine_capacity_cc?: number;
  registration: string;
  tax_status: string;
  tax_due_date?: string;
  mot_status?: string;
  mot_expiry_date?: string;
  co2_emissions?: number;
  month_of_first_registration?: string;
  wheelplan?: string;
  euro_status?: string;
}

export interface MOTAdvisory {
  text: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  is_repeated: boolean;
}

export interface MOTRecord {
  test_date: string;
  testDate?: string;
  expiryDate?: string;
  result: string;
  mileage?: number;
  defects: string[];
  advisories: string[];
  failures: string[];
  dangerousDefects: string[];
  majorDefects: string[];
  minorDefects: string[];
  classified_defects: MOTAdvisory[];
}

export interface MOTIntelligence {
  repeated_issues: string[];
  highest_risk_category: string;
  highest_severity: 'Low' | 'Medium' | 'High' | 'Critical';
  maintenance_warnings: string[];
  future_concerns: string[];
  category_counts: Record<string, number>;
  severity_counts: Record<string, number>;
  summary: string;
}

export interface MileageRecord {
  date: string;
  mileage: number;
}

export interface OwnershipScore {
  score: number;
  ownership_score: number;
  summary: string;
  what_looks_good: string;
  potential_problems: string;
  expected_yearly_cost: string;
  should_buy_recommendation: string;
  verdict: 'BUY' | 'INSPECT' | 'AVOID';
  risk_level: 'Low' | 'Medium' | 'High';
  maintenance_risk: 'Low' | 'Medium' | 'High';
  yearly_running_cost: number;
  yearly_cost_estimate: number;
  reliability_rating: 'Strong' | 'Average' | 'Caution';
  environmental_rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  ai_summary: string;
  score_explanation: string;
  affecting_factors: string[];
  data_basis: string;
  risk_badges: string[];
  repeated_tyres: boolean;
  repeated_brakes: boolean;
  mileage_inconsistency: boolean;
  analysis_notes: string[];
}

export interface VehicleReport {
  vehicle: VehicleDetails;
  current_mot_status: string;
  mot_valid_until?: string;
  mot_history: MOTRecord[];
  mileage_history: MileageRecord[];
  mot_intelligence: MOTIntelligence;
  ownership_score: OwnershipScore;
  data_source: string;
  confidence_level: 'High' | 'Medium' | 'Low';
  trust_messages: string[];
  unavailable_data: string[];
  warnings: string[];
}

export const searchVehicle = async (registration: string): Promise<VehicleReport> => {
  try {
    const response = await apiClient.post<VehicleReport>('/api/vehicle/search', {
      registration,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data.detail || 'Invalid registration number');
    }
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
