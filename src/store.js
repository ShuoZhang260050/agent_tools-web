import { reactive } from 'vue'

export const PERMISSION_CHOICES = [
  { value: 'request_approval', label: '请求审批', color: '#d97706', desc: '敏感操作执行前需您确认' },
  { value: 'auto_approve', label: '替我审批', color: '#2563eb', desc: '自动执行敏感操作并告知您' },
  { value: 'full_access', label: '完全访问', color: '#10a37f', desc: '所有操作自动执行，无需确认' },
]

export const store = reactive({
  currentTid: null,
  sending: false,
  approvalPending: false,
  syncPending: false,
  currentModel: localStorage.getItem('agent_model') || '',
  currentPermission: localStorage.getItem('agent_permission') || 'request_approval',
  availableModels: [],
  authToken: localStorage.getItem('agent_token') || '',
  currentUser: localStorage.getItem('agent_user') || '',
  workspace: '',
  permissionChoices: [...PERMISSION_CHOICES],
  traceVisible: false,
  currentAbort: null,
  authed: false,
  toast: { message: '', type: 'error', visible: false },
})

export function setAuthed(v) {
  store.authed = v
}

export function logout() {
  localStorage.removeItem('agent_token')
  localStorage.removeItem('agent_user')
  store.authToken = ''
  store.currentUser = ''
  store.currentTid = null
  store.authed = false
}

export function permissionChoice(value) {
  return PERMISSION_CHOICES.find((c) => c.value === value) || PERMISSION_CHOICES[0]
}

export function setPermission(value) {
  store.currentPermission = value
  localStorage.setItem('agent_permission', value)
}

export function setModel(value) {
  store.currentModel = value
  localStorage.setItem('agent_model', value)
}

let toastTimer = null
export function showToast(message, type = 'error') {
  store.toast = { message, type, visible: true }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    store.toast.visible = false
  }, 4000)
}
