<script setup>
import { ref } from "vue"

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  documents: { type: Array, default: () => [] },
  currentTid: { type: String, default: null },
  workspace: { type: String, default: "" },
  traceVisible: { type: Boolean, default: false },
})
const emit = defineEmits(["new-session", "select-session", "delete-session", "rename-session", "delete-document", "open-workspace", "toggle-trace"])
const renamingId = ref(null)
const renameValue = ref("")

function startRename(s) { renamingId.value = s.thread_id; renameValue.value = s.title || s.thread_id.slice(0, 18) + "…" }
function finishRename(save) {
  if (save && renameValue.value.trim()) emit("rename-session", renamingId.value, renameValue.value.trim())
  renamingId.value = null
}
</script>

<template>
  <div class="sidebar">
    <header>会话</header>
    <button class="new-btn" @click="emit('new-session')">+ 新建会话</button>
    <div class="session-list">
      <div v-for="s in sessions" :key="s.thread_id"
           class="session-item" :class="{ active: s.thread_id === currentTid }"
           @click="emit('select-session', s.thread_id)">
        <div class="sid" @dblclick.stop="startRename(s)">
          <template v-if="renamingId === s.thread_id">
            <input class="rename-input" v-model="renameValue" @click.stop
                   @keyup.enter="finishRename(true)" @keyup.escape="finishRename(false)"
                   @blur="finishRename(true)" />
          </template>
          <template v-else>
            {{ s.title || s.thread_id.slice(0, 18) + '…' }}
            <div class="meta">{{ s.message_count }} 条消息</div>
          </template>
        </div>
        <button class="del-btn" title="删除" @click.stop="emit('delete-session', s.thread_id)">✕</button>
      </div>
    </div>
    <div class="doc-section">
      <h3>文档知识库 <span style="font-weight:400;color:var(--muted);">（可问 Agent 检索）</span></h3>
      <div v-if="documents.length === 0" style="font-size:12px;color:var(--muted);padding:4px 8px;">暂无文档</div>
      <div v-for="d in documents" :key="d.id" class="doc-item">
        <span class="doc-name">{{ d.filename }}</span>
        <button class="doc-del" title="删除" @click="emit('delete-document', d.id)">✕</button>
      </div>
    </div>
    <div class="sidebar-footer">
      <button class="ws-btn" @click="emit('open-workspace')" :title="workspace">
        {{ workspace ? "📂 " + workspace.split(/[\\\/]/).pop() : "📂 工作空间" }}
      </button>
      <button class="trace-btn" :class="{ active: traceVisible }" @click="emit('toggle-trace')">
        {{ traceVisible ? "调试 ON" : "调试" }}
      </button>
    </div>
  </div>
</template>
