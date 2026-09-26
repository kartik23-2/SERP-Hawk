import { Customer, Call, DashboardStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/customers`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function createCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/api/v1/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
}

export async function fetchCalls(filters: {
  search?: string;
  status?: string;
  outcome?: string;
  lead_status?: string;
  follow_up_required?: boolean;
}): Promise<Call[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/calls`);
  if (filters.search) url.searchParams.set('search', filters.search);
  if (filters.status) url.searchParams.set('status', filters.status);
  if (filters.outcome) url.searchParams.set('outcome', filters.outcome);
  if (filters.lead_status) url.searchParams.set('lead_status', filters.lead_status);
  if (filters.follow_up_required !== undefined) {
    url.searchParams.set('follow_up_required', String(filters.follow_up_required));
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch calls');
  return res.json();
}

export async function fetchCallDetail(callId: string): Promise<Call> {
  const res = await fetch(`${API_BASE_URL}/api/v1/calls/${callId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch call details');
  return res.json();
}

export async function initiateCall(customerId: number, mode: string = 'simulated') {
  const res = await fetch(`${API_BASE_URL}/api/v1/calls/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, call_mode: mode }),
  });
  if (!res.ok) throw new Error('Failed to initiate outbound call');
  return res.json();
}

export async function endCallManually(callId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/calls/${callId}/end`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to end call');
  return res.json();
}
