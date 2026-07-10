import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const cleanRegistration = (registration: string) => registration.toUpperCase().replace(/\s+/g, '');

// These interfaces mirror backend/app/models/schemas.py. Keep field names
// snake_case because the frontend consumes the FastAPI response directly.
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
  date_of_last_v5c_issued?: string;
  marked_for_export?: boolean;
  type_approval?: string;
  month_of_first_registration?: string;
  wheelplan?: string;
  euro_status?: string;
  first_used_date?: string;
  has_outstanding_recall?: string;
  manufacture_date?: string;
  primary_colour?: string;
  registration_date?: string;
  body_style?: string;
  bodyStyle?: string;
  body_type?: string;
  bodyType?: string;
}

export interface MOTAdvisory {
  text: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  is_repeated: boolean;
}

export type CountMap = {
  [key: string]: number;
};

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
  category_counts: CountMap;
  severity_counts: CountMap;
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

export interface AIReport {
  headline: string;
  summary: string;
  buyVerdict: string;
  topRisks: string[];
  positiveSigns: string[];
  ownershipAdvice: string;
  confidenceNote: string;
  source?: 'gemini' | 'groq' | 'rule';
  provider?: 'gemini' | 'groq' | 'fallback';
}

export interface VehicleSpecificationData {
  fuel_economy?: string;
  performance?: string;
  dimensions?: string;
  weight?: string;
  safety_rating?: string;
  insurance_group?: string;
  road_tax_band?: string;
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
  ai_report?: AIReport | null;
  vehicle_specifications?: VehicleSpecificationData | null;
}

export const searchVehicle = async (registration: string): Promise<VehicleReport> => {
  try {
    // Normalise before sending so the route URL, cache keys, and DVLA lookup use
    // the same registration shape.
    const response = await apiClient.post<VehicleReport>('/api/vehicle/search', {
      registration: cleanRegistration(registration),
    });
    return response.data;
  } catch (error: any) {
    if (!error.response) {
      throw new Error(
        'CarTruth backend is not reachable. Start the FastAPI server on port 8000 and try again.',
      );
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.detail || 'Invalid registration number');
    }
    if (error.response?.status === 404) {
      throw new Error(
        error.response.data.detail ||
          'We could not find that vehicle. Check the registration and try again.',
      );
    }
    if (error.response?.status >= 500) {
      throw new Error(
        'Official vehicle data is temporarily unavailable. Please try again shortly.',
      );
    }
    throw new Error(
      'Unable to load the vehicle report right now. Please check your connection and try again.',
    );
  }
};

export const downloadVehiclePdf = async (registration: string): Promise<Blob> => {
  try {
    const cleaned = cleanRegistration(registration);
    const response = await apiClient.get(`/api/vehicle/${encodeURIComponent(cleaned)}/pdf`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });
    return response.data;
  } catch (error: any) {
    if (!error.response) {
      throw new Error('CarTruth backend is not reachable. Please try Print report instead.');
    }
    throw new Error('Unable to generate PDF right now. Please try Print report instead.');
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};
