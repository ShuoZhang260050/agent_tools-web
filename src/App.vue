<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from './api.js'
import { store, setAuthed, logout, setPermission, setModel, PERMISSION_CHOICES, showToast } from './store.js'
import { useChat } from './useChat.js'
import AuthView from './components/AuthView.vue'
import Sidebar from './components/Sidebar.vue'
import ChatHeader from './components/ChatHeader.vue'
import MessageList from './components/MessageList.vue'
import ChatInput from './components/ChatInput.vue'
import WorkspaceModal from './components/WorkspaceModal.vue'
import TracePanel from './components/TracePanel.vue'

const { items, typing, sendMessage, resumeChat, clearMessages, addMessage, abort } = useChat()
const wsModalOpen = ref(false)
const sessions = ref([])
const documents = ref([])

function onAuthed(token, username) {
  localStorage.setItem('agent_token', token)
  localStorage.setItem('agent_user', username)
  store.authToken = token
  store.currentUser = username
  setAuthed(true)
  newSession()
  loadModels()
  loadPermissions()
  loadSessions()
  loadDocuments()
  loadWorkspace()
}

async function checkAuth() {
  if (store.authToken) {
    try {
      await api.getMe()
    } catch {
      logout()
      return
    }
    setAuthed(true)
    store.currentUser = localStorage.getItem('agent_user') || ''
    newSession()
    loadModels()
    loadPermissions()
    loadSessions()
    loadDocuments()
    loadWorkspace()
  } else {
    setAuthed(false)
  }
}

async function loadModels() {
  try {
    const data = await api.getModels()
    store.availableModels = data.models || []
    const names = store.availableModels.map((m) => m.name)
    if (!store.currentModel || !names.includes(store.currentModel)) {
      if (names.length) setModel(names[0])
    }
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function loadPermissions() {
  try {
    const data = await api.getPermissions()
    const localMap = Object.fromEntries(PERMISSION_CHOICES.map((p) => [p.value, p]))
    store.permissionChoices = (data.choices || []).map((c) => ({ ...(localMap[c.value] || {}), ...c }))
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function loadSessions() {
  try {
    const data = await api.getSessions()
    sessions.value = data.sessions || []
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function loadDocuments() {
  try {
    const data = await api.getDocuments()
    documents.value = data.documents || []
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function loadWorkspace() {
  try {
    const data = await api.getWorkspace()
    store.workspace = data.workspace || ''
  } catch (e) {
    showToast(e.message || '加载工作空间失败')
  }
}

function newSession() {
  if (store.sending) return
  store.currentTid = null
  clearMessages()
  addMessage(
    'assistant',
    '\u65b0\u4f1a\u8bdd\u5df2\u521b\u5efa\uff0c\u8f93\u5165\u6d88\u606f\u5f00\u59cb\u5bf9\u8bdd\u3002'
  )
}

async function selectSession(tid) {
  if (store.sending) return
  store.currentTid = tid
  clearMessages()
  try {
    const data = await api.getSession(tid)
    ;(data.messages || []).forEach((m) => {
      if (m.role === 'user') {
        addMessage('user', m.content, {
          image: m.image,
          file: m.file
            ? {
                name: m.file,
                text: m.file_text,
                size: m.file_text ? new Blob([m.file_text]).size : null,
                type: m.file.split('.').pop().toUpperCase(),
                onClick: () => {},
              }
            : null,
        })
      } else if (m.role === 'assistant') {
        if (m.tool_calls && m.tool_calls.length) return
        if (m.content) addMessage('assistant', m.content, { markdown: true })
      }
    })
    loadSessions()
  } catch (e) {
    addMessage('assistant', '\u26a0\ufe0f \u52a0\u8f7d\u5386\u53f2\u5931\u8d25: ' + e.message)
  }
}

async function deleteSession(tid) {
  if (!confirm('\u786e\u5b9a\u5220\u9664\u6b64\u4f1a\u8bdd\uff1f')) return
  try {
    await api.deleteSession(tid)
    if (store.currentTid === tid) newSession()
    loadSessions()
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function renameSession(tid, title) {
  try {
    await api.renameSession(tid, title)
  } catch (e) {
    showToast(e.message || '操作失败')
  }
  loadSessions()
}

async function deleteDocument(docId) {
  if (!confirm('\u786e\u5b9a\u5220\u9664\u6587\u6863\uff1f')) return
  try {
    await api.deleteDocument(docId)
    loadDocuments()
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

function onSend(body) {
  const fullBody = {
    message: body.message || '\u8bf7\u5206\u6790\u9644\u4ef6\u5185\u5bb9',
    thread_id: store.currentTid,
    permission: store.currentPermission,
  }
  if (store.currentModel) fullBody.model = store.currentModel
  if (body.image) fullBody.image = body.image
  if (body.attachment_text) {
    fullBody.attachment_text = body.attachment_text
    fullBody.attachment_name = body.attachment_name
  }
  const fileObj = body.attachment_name
    ? {
        name: body.attachment_name,
        text: body.attachment_text,
        size: body.attachment_text ? new Blob([body.attachment_text]).size : null,
        type: body.attachment_name.split('.').pop().toUpperCase(),
        onClick: () => {},
      }
    : null
  addMessage('user', body.message, { image: body.image, file: fileObj })
  sendMessage(fullBody)
  loadSessions()
}

function onApprove() {
  resumeChat('approved')
}
function onDeny() {
  resumeChat('denied')
}
function onAbort() {
  abort()
}
function onSynced() {
  store.syncPending = false
  loadSessions()
}
function onReverted() {
  store.syncPending = false
}
function onWorkspaceSaved(path) {
  store.workspace = path
  wsModalOpen.value = false
}

async function onUploadRag(file) {
  const formData = new FormData()
  formData.append('file', file)
  addMessage('user', '\u5165\u77e5\u8bc6\u5e93: ' + file.name)
  typing.value = true
  try {
    const data = await api.uploadDocument(formData)
    typing.value = false
    addMessage(
      'assistant',
      '\u2705 \u6587\u6863\u5df2\u5165\u5e93: ' +
        data.filename +
        '\uff08' +
        data.chunks +
        ' \u4e2a\u7247\u6bb5\uff09\u3002\u4f60\u53ef\u4ee5\u8ba9\u6211\u68c0\u7d22\u6587\u6863\u5185\u5bb9\u3002'
    )
    loadDocuments()
  } catch (err) {
    typing.value = false
    addMessage('assistant', '\u26a0\ufe0f \u4e0a\u4f20\u5931\u8d25: ' + err.message)
  }
}

watch(
  () => store.currentTid,
  () => {
    if (store.authed) loadSessions()
  }
)

onMounted(() => {
  checkAuth()
})
</script>

<template>
  <AuthView
    v-if="!store.authed"
    @authed="onAuthed"
  />
  <template v-else>
    <div style="display: flex; width: 100%; height: 100vh">
      <Sidebar
        :sessions="sessions"
        :documents="documents"
        :current-tid="store.currentTid"
        :workspace="store.workspace"
        :trace-visible="store.traceVisible"
        @new-session="newSession"
        @select-session="selectSession"
        @delete-session="deleteSession"
        @rename-session="renameSession"
        @delete-document="deleteDocument"
        @open-workspace="wsModalOpen = true"
        @toggle-trace="store.traceVisible = !store.traceVisible"
      />
      <div class="main">
        <ChatHeader
          :current-tid="store.currentTid"
          :current-user="store.currentUser"
          @logout="logout"
        />
        <TracePanel
          :visible="store.traceVisible"
          :thread-id="store.currentTid"
        />
        <MessageList
          :items="items"
          :typing="typing"
          @approve="onApprove"
          @deny="onDeny"
          @synced="onSynced"
          @reverted="onReverted"
        />
        <ChatInput
          :sending="store.sending"
          :approval-pending="store.approvalPending"
          :sync-pending="store.syncPending"
          :available-models="store.availableModels"
          :current-model="store.currentModel"
          :current-permission="store.currentPermission"
          @send="onSend"
          @abort="onAbort"
          @upload-rag="onUploadRag"
          @select-model="setModel"
          @select-permission="setPermission"
        />
      </div>
    </div>
    <WorkspaceModal
      :open="wsModalOpen"
      @close="wsModalOpen = false"
      @saved="onWorkspaceSaved"
    />
    <Transition name="toast">
      <div
        v-if="store.toast.visible"
        class="toast"
        :class="store.toast.type"
        @click="store.toast.visible = false"
      >
        {{ store.toast.message }}
      </div>
    </Transition>
  </template>
</template>
