import { describe, test, expect, beforeEach } from 'vitest'
import { useChat } from '../src/useChat.js'
import { store } from '../src/store.js'

describe('useChat handleEvent', () => {
  let chat

  beforeEach(() => {
    chat = useChat()
    chat.clearMessages()
    store.approvalPending = false
    store.syncPending = false
    store.sending = false
    store.currentTid = null
  })

  test('token events accumulate into one assistant message', () => {
    const state = chat.makeStreamState()
    chat.handleEvent({ type: 'token', content: 'hello' }, state)
    chat.handleEvent({ type: 'token', content: ' world' }, state)
    expect(chat.items.value).toHaveLength(1)
    expect(chat.items.value[0].content).toBe('hello world')
    expect(chat.items.value[0].role).toBe('assistant')
    expect(chat.items.value[0].markdown).toBe(true)
  })

  test('tool_call creates a running tool card', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      { type: 'tool_call', name: 'calculator', args: { x: 1 }, id: 't1', permission: 'full_access' },
      state
    )
    expect(chat.items.value).toHaveLength(1)
    expect(chat.items.value[0].type).toBe('tool_card')
    expect(chat.items.value[0].status).toBe('running')
  })

  test('tool_call with request_approval creates pending card', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      { type: 'tool_call', name: 'run_command', args: {}, id: 't1', permission: 'request_approval' },
      state
    )
    expect(chat.items.value[0].status).toBe('pending')
  })

  test('tool_result updates matching card', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      { type: 'tool_call', name: 'calc', args: {}, id: 't1', permission: 'full_access' },
      state
    )
    chat.handleEvent({ type: 'tool_result', tool_call_id: 't1', content: '42' }, state)
    expect(chat.items.value[0].status).toBe('done')
    expect(chat.items.value[0].result).toBe('42')
  })

  test('approval_request sets store.approvalPending', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      { type: 'tool_call', name: 'run_command', args: {}, id: 't1', permission: 'request_approval' },
      state
    )
    chat.handleEvent(
      { type: 'approval_request', tool: 'run_command', args: {}, tool_call_id: 't1', interrupt_id: 'i1' },
      state
    )
    expect(store.approvalPending).toBe(true)
    expect(chat.items.value[0].approval).toBeTruthy()
    expect(chat.items.value[0].approval.interrupt_id).toBe('i1')
  })

  test('done with pending_sync creates sync panel', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      {
        type: 'done',
        thread_id: 't1',
        pending_sync: true,
        diff: { added: ['a.py'], modified: [], deleted: [] },
      },
      state
    )
    expect(store.syncPending).toBe(true)
    expect(store.currentTid).toBe('t1')
    expect(chat.items.value.some((i) => i.type === 'sync_panel')).toBe(true)
  })

  test('done without pending_sync clears flags', () => {
    const state = chat.makeStreamState()
    store.sending = true
    chat.handleEvent({ type: 'done', thread_id: 't1', pending_sync: false }, state)
    expect(store.syncPending).toBe(false)
    expect(store.sending).toBe(false)
  })

  test('error event shows message and clears flags', () => {
    const state = chat.makeStreamState()
    store.sending = true
    store.approvalPending = true
    chat.handleEvent({ type: 'error', message: 'something broke' }, state)
    expect(store.sending).toBe(false)
    expect(store.approvalPending).toBe(false)
    expect(chat.items.value.some((i) => i.content?.includes('something broke'))).toBe(true)
  })

  test('done hides all tool cards', () => {
    const state = chat.makeStreamState()
    chat.handleEvent(
      { type: 'tool_call', name: 'calc', args: {}, id: 't1', permission: 'full_access' },
      state
    )
    chat.handleEvent({ type: 'tool_result', tool_call_id: 't1', content: '42' }, state)
    expect(chat.items.value[0].hidden).toBeUndefined()
    chat.handleEvent({ type: 'done', thread_id: 't1', pending_sync: false }, state)
    expect(chat.items.value[0].hidden).toBe(true)
  })
})
