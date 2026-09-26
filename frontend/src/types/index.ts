export interface Customer {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  company_name?: string;
  purpose: string;
  product: string;
  notes?: string;
  created_at: string;
}

export interface CallTranscript {
  id: number;
  call_id: string;
  speaker: 'AI' | 'CUSTOMER' | 'SYSTEM';
  message: string;
  confidence?: number;
  timestamp: string;
}

export interface CallSummary {
  id: number;
  call_id: string;
  customer_name?: string;
  requirement?: string;
  capacity?: string;
  location?: string;
  application?: string;
  budget?: string;
  timeline?: string;
  lead_status: 'Hot' | 'Warm' | 'Cold' | 'Not Interested' | 'Invalid';
  follow_up_required: boolean;
  follow_up_notes?: string;
  key_requirements?: string;
  customer_intent?: string;
  important_points?: string;
  call_outcome?: string;
  summary_text?: string;
  created_at?: string;
}

export interface Call {
  id: string;
  customer_id?: number;
  customer_name: string;
  phone_number: string;
  direction: string;
  status: 'INITIATED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'DISCONNECTED' | 'BUSY';
  outcome: 'PENDING' | 'INTERESTED' | 'NOT_INTERESTED' | 'FOLLOW_UP_REQUIRED' | 'FAILED' | 'INCOMPLETE';
  start_time?: string;
  end_time?: string;
  duration_seconds: number;
  failure_reason?: string;
  created_at: string;
  customer?: Customer;
  transcripts?: CallTranscript[];
  summary?: CallSummary;
}

export interface DashboardStats {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  interested_leads: number;
  follow_ups_required: number;
  avg_call_duration_seconds: number;
}
