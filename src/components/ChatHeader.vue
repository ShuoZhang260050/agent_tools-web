<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"

const props = defineProps({
  currentTid: { type: String, default: null },
  currentUser: { type: String, default: "" },
  workspace: { type: String, default: "" },
  traceVisible: { type: Boolean, default: false },
})
const emit = defineEmits(["open-workspace", "toggle-trace", "logout"])
</script>

<template>
  <div class="header">
    Agent Chat
    <span v-if="currentTid" style="font-weight:400;color:var(--muted);font-size:12px;">· {{ currentTid.slice(0, 8) }}</span>
    <button class="trace-btn" :class="{ active: traceVisible }" @click="emit('toggle-trace')">
      {{ traceVisible ? "🔴 Trace ON" : "⚪ Trace" }}
    </button>
    <button class="ws-btn" @click="emit('open-workspace')" :title="workspace">
      {{ workspace ? "📁 " + workspace.split(/[\\\/]/).pop() : "📁 工作区" }}
    </button>
    <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
      <span style="color:var(--muted);font-size:13px;">{{ currentUser }}</span>
      <button @click="emit('logout')" style="font-size:12px;color:var(--accent);border:none;background:none;cursor:pointer;">退出</button>
    </div>
  </div>
</template>
