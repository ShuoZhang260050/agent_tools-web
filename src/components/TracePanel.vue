<script setup>
import { ref, watch } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  visible: Boolean,
  threadId: { type: String, default: null },
})

const traces = ref([])

async function load() {
  try {
    const data = await api.getTraces(props.threadId)
    traces.value = data.traces || []
  } catch {
    traces.value = []
  }
}

watch(
  () => [props.visible, props.threadId],
  ([vis]) => {
    if (vis) load()
  },
  { immediate: true }
)

function fmtTime(ts) {
  return ts ? ts.slice(11, 19) : ''
}

function fmtTokens(t) {
  return t && t.total_tokens ? t.total_tokens : ''
}
</script>

<template>
  <div
    class="trace-panel"
    :style="{ display: visible ? 'block' : 'none' }"
  >
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>类型</th>
          <th>名称</th>
          <th>耗时</th>
          <th>Tokens</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="traces.length === 0">
          <td
            colspan="5"
            class="trace-empty"
          >
            暂无追踪记录
          </td>
        </tr>
        <tr
          v-for="(t, i) in traces"
          :key="i"
          :class="t.type"
        >
          <td>{{ fmtTime(t.timestamp) }}</td>
          <td>{{ t.type }}</td>
          <td>{{ t.name || '' }}</td>
          <td>{{ t.duration_ms || 0 }}ms</td>
          <td>{{ fmtTokens(t.tokens) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.trace-panel {
  max-height: 300px;
  overflow-y: auto;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.trace-panel table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.trace-panel th {
  text-align: left;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--panel);
}
.trace-panel td {
  padding: 4px 12px;
  border-bottom: 1px solid #f0f0f2;
}
.trace-panel tr.llm td {
  background: #f0fdf4;
}
.trace-panel tr.tool td {
  background: #eff6ff;
}
.trace-empty {
  text-align: center;
  color: var(--muted);
  padding: 12px;
}
</style>
