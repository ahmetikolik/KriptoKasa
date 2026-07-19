const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(body?.message ?? 'Request failed')
  }

  return body
}

export function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getPrices() {
  return request('/api/market/prices')
}

export function getPriceHistory(symbol) {
  return request(`/api/market/history/${symbol}`)
}

export function getPortfolio(token) {
  return request('/api/portfolio', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getAccount(token) {
  return request('/api/account/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateAccount(token, payload) {
  return request('/api/account/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function changePassword(token, payload) {
  return request('/api/account/password', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function deleteAccount(token, payload) {
  return request('/api/account/me', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function executeTrade(token, payload) {
  return request('/api/trades', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function queryAi(token, question) {
  return request('/api/ai/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question }),
  })
}
