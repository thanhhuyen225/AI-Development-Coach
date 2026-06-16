import { TOKEN_KEY } from '../constants/coach'

const BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Request failed')
  }
  return res.json()
}

export const api = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: import('../types').User }>(`${BASE}/auth/register`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: import('../types').User }>(`${BASE}/auth/login`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  me: () =>
    request<{ user: import('../types').User; stats: import('../types').UserStats }>(`${BASE}/auth/me`),

  updateProfile: (data: Partial<import('../types').User>) =>
    request<import('../types').User>(`${BASE}/auth/profile`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>(`${BASE}/auth/logout`, { method: 'POST' }),

  getHistory: () =>
    request<{ sessions: import('../types').SessionSummary[] }>(`${BASE}/history`),

  getStaticData: () => request<import('../types').StaticData>(`${BASE}/static`),

  createSession: () =>
    request<{ id: string; session: import('../types').Session }>(`${BASE}/sessions`, { method: 'POST' }),

  getSession: (id: string) => request<import('../types').Session>(`${BASE}/sessions/${id}`),

  deleteSession: (id: string) =>
    request<{ message: string }>(`${BASE}/sessions/${id}`, { method: 'DELETE' }),

  updateOnboarding: (id: string, data: {
    currentRole: string; targetRole: string; feedback: string; careerLevel: string
  }) =>
    request<import('../types').Session>(`${BASE}/sessions/${id}/onboarding`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),

  submitStrength: (id: string, answers: Record<string, number>) =>
    request<{ strength: { primary: string; secondary: string }; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/strength`, { method: 'POST', body: JSON.stringify({ answers }) },
    ),

  startCoaching: (id: string) =>
    request<{ reply: import('../types').CoachReply; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/coach/start`, { method: 'POST' },
    ),

  sendCoachMessage: (id: string, message: string) =>
    request<{ reply: import('../types').CoachReply; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/coach/message`, { method: 'POST', body: JSON.stringify({ message }) },
    ),

  submitGuided: (id: string, selections: string[]) =>
    request<import('../types').Session>(`${BASE}/sessions/${id}/coach/guided`, {
      method: 'POST', body: JSON.stringify({ selections }),
    }),

  runAnalysis: (id: string) =>
    request<{ plan: import('../types').DevelopmentPlan; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/analysis`, { method: 'POST' },
    ),

  commitBehaviors: (id: string, indices: number[]) =>
    request<import('../types').Session>(`${BASE}/sessions/${id}/commit`, {
      method: 'POST', body: JSON.stringify({ indices }),
    }),

  startFollowUp: (id: string) =>
    request<{ reply: string; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/followup/start`, { method: 'POST' },
    ),

  sendFollowUp: (id: string, message: string) =>
    request<{ reply: string; session: import('../types').Session }>(
      `${BASE}/sessions/${id}/followup/message`, { method: 'POST', body: JSON.stringify({ message }) },
    ),
}
