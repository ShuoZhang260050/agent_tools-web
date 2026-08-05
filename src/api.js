const BASE = import.meta.env.VITE_API_BASE || ''

export function getToken() {
  return localStorage.getItem('agent_token') || ''
}

export function authHeaders() {
  const t = getToken()
  return t
    ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t }
    : { 'Content-Type': 'application/json' }
}

export function authHeadersMultipart() {
  const t = getToken()
  return t ? { 'Authorization': 'Bearer ' + t } : {}
}

async function request(path, options = {}) {
  const resp = await fetch(BASE + path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`)
  return data
}

export const api = {
  async login(username, password) {
    const resp = await fetch(BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.detail || '登录失败')
    return data
  },

  async register(username, password) {
    const resp = await fetch(BASE + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.detail || '注册失败')
    return data
  },

  async getModels() {
    return request('/models')
  },

  async getSessions() {
    return request('/sessions')
  },

  async getSession(tid) {
    return request('/sessions/' + encodeURIComponent(tid))
  },

  async deleteSession(tid) {
    return request('/sessions/' + encodeURIComponent(tid), { method: 'DELETE' })
  },

  async renameSession(tid, title) {
    return request('/sessions/' + encodeURIComponent(tid), {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })
  },

  async getDocuments() {
    return request('/documents')
  },

  async deleteDocument(docId) {
    return request('/documents/' + docId, { method: 'DELETE' })
  },

  async uploadDocument(formData) {
    const resp = await fetch(BASE + '/documents', {
      method: 'POST',
      headers: authHeadersMultipart(),
      body: formData,
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.detail || '上传失败')
    return data
  },

  async extractText(formData) {
    const resp = await fetch(BASE + '/extract-text', {
      method: 'POST',
      headers: authHeadersMultipart(),
      body: formData,
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.detail || '解析失败')
    return data
  },

  async getWorkspace() {
    return request('/workspace')
  },

  async setWorkspace(path) {
    return request('/workspace?path=' + encodeURIComponent(path), { method: 'POST' })
  },

  async browseWorkspace(path) {
    return request('/workspace/browse?path=' + encodeURIComponent(path))
  },

  async getDrives() {
    return request('/workspace/drives')
  },

  async getTraces(threadId) {
    const url = '/traces' + (threadId ? '?thread_id=' + encodeURIComponent(threadId) : '')
    return request(url)
  },

  async verifyShadow(tid, command) {
    return request('/workspace/verify?thread_id=' + encodeURIComponent(tid) + '&command=' + encodeURIComponent(command), { method: 'POST' })
  },

  async syncShadow(tid, verifyCommand) {
    const params = 'thread_id=' + encodeURIComponent(tid) + (verifyCommand ? '&verify_command=' + encodeURIComponent(verifyCommand) : '')
    return request('/workspace/sync?' + params, { method: 'POST' })
  },

  async revertShadow(tid) {
    return request('/workspace/revert?thread_id=' + encodeURIComponent(tid), { method: 'POST' })
  },

  chat(body, signal) {
    return fetch(BASE + '/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    })
  },

  resume(body, signal) {
    return fetch(BASE + '/chat/resume', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    })
  },
}

export { BASE }
