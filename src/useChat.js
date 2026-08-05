import { ref } from 'vue'
import { api } from './api.js'
import { store } from './store.js'

export function useChat() {
  const items = ref([])
  const typing = ref(false)

  function makeStreamState() {
    return { assistantIdx: null, assistantRaw: '', toolCardIdxs: {} }
  }

  function clearMessages() { items.value = [] }

  function addMessage(role, content, opts = {}) {
    const item = { type: 'message', role, content, ...opts }
    items.value.push(item)
    return item
  }

  function handleEvent(ev, state) {
    if (ev.type === 'token') {
      typing.value = false
      if (state.assistantIdx === null) {
        items.value.push({ type: 'message', role: 'assistant', content: '', markdown: true })
        state.assistantIdx = items.value.length - 1
        state.assistantRaw = ''
      }
      state.assistantRaw += ev.content
      items.value[state.assistantIdx].content = state.assistantRaw
    } else if (ev.type === 'tool_call') {
      typing.value = false
      items.value.push({
        type: 'tool_card',
        toolCall: { name: ev.name, args: ev.args, id: ev.id, permission: ev.permission },
        status: ev.permission === 'request_approval' ? 'pending' : 'running',
        result: null, approval: null,
      })
      if (ev.id) state.toolCardIdxs[ev.id] = items.value.length - 1
    } else if (ev.type === 'tool_result') {
      const idx = state.toolCardIdxs[ev.tool_call_id]
      if (idx !== undefined) {
        items.value[idx].status = 'done'
        items.value[idx].result = ev.content
        items.value[idx].approval = null
      }
    } else if (ev.type === 'approval_request') {
      typing.value = false
      store.approvalPending = true
      store.sending = false
      const idx = state.toolCardIdxs[ev.tool_call_id]
      if (idx !== undefined) {
        items.value[idx].approval = {
          tool: ev.tool, args: ev.args,
          tool_call_id: ev.tool_call_id, interrupt_id: ev.interrupt_id,
        }
      }
    } else if (ev.type === 'error') {
      typing.value = false
      store.approvalPending = false
      store.syncPending = false
      store.sending = false
      addMessage('assistant', '\u26a0\ufe0f ' + (ev.message || '\u672a\u77e5\u9519\u8bef'))
    } else if (ev.type === 'done') {
      store.currentTid = ev.thread_id
      typing.value = false
      store.approvalPending = false
      if (ev.pending_sync && ev.diff) {
        store.syncPending = true
        store.sending = false
        items.value.push({ type: 'sync_panel', diff: ev.diff, tid: ev.thread_id })
      } else {
        store.syncPending = false
        store.sending = false
      }
      if (state.assistantIdx === null) addMessage('assistant', '\uff08\u65e0\u5185\u5bb9\u8fd4\u56de\uff09')
      Object.values(state.toolCardIdxs).forEach((idx) => { items.value[idx].hidden = true })
    }
  }

  async function readStream(resp, state) {
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop()
      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data: '))
        if (!line) continue
        let ev
        try { ev = JSON.parse(line.slice(6)) } catch { continue }
        handleEvent(ev, state)
      }
    }
  }

  async function sendMessage(body) {
    store.sending = true
    store.approvalPending = false
    store.syncPending = false
    typing.value = true
    const state = makeStreamState()
    store.currentAbort = new AbortController()
    try {
      const resp = await api.chat(body, store.currentAbort.signal)
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      await readStream(resp, state)
    } catch (e) {
      typing.value = false
      if (e.name !== 'AbortError') addMessage('assistant', '\u26a0\ufe0f \u8bf7\u6c42\u5931\u8d25: ' + e.message)
    } finally {
      store.sending = false
      store.currentAbort = null
    }
  }

  async function resumeChat(decision) {
    if (!store.currentTid) return
    store.approvalPending = false
    store.sending = true
    typing.value = true
    const state = makeStreamState()
    store.currentAbort = new AbortController()
    try {
      const resp = await api.resume(
        { thread_id: store.currentTid, decision, permission: store.currentPermission },
        store.currentAbort.signal,
      )
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      await readStream(resp, state)
    } catch (e) {
      typing.value = false
      if (e.name !== 'AbortError') addMessage('assistant', '\u26a0\ufe0f \u6062\u590d\u5931\u8d25: ' + e.message)
    } finally {
      store.sending = false
      store.currentAbort = null
    }
  }

  function abort() { if (store.currentAbort) store.currentAbort.abort() }

  return { items, typing, sendMessage, resumeChat, clearMessages, addMessage, abort }
}