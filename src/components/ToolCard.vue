<script setup>
import { ref, computed } from 'vue'
import { describeToolCall, SCREENSHOT_RE } from '../utils.js'

const props = defineProps({
  toolCall: { type: Object, default: () => ({}) },
  status: { type: String, default: 'running' },
  result: { type: String, default: null },
  approval: { type: Object, default: null },
})
const collapsed = ref(false)
const expanded = ref(false)

const statusText = computed(() => ({ running: '运行中…', pending: '等待审批…', done: '完成' })[props.status] || '')
const statusClass = computed(() => 'tc-status ' + props.status)
const descHtml = computed(() => describeToolCall(props.approval?.tool, props.approval?.args))
const resultLines = computed(() => String(props.result || '').split('\n').length)
const hasClamp = computed(() => resultLines.value > 10)
const shotMatch = computed(() => {
  const m = String(props.result || '').match(SCREENSHOT_RE)
  return m ? m[0] : null
})
</script>

<template>
  <div
    class="tool-card"
    :class="{ collapsed }"
  >
    <div
      class="tc-head"
      @click="collapsed = !collapsed"
    >
      {{ toolCall.name }}
      <span
        v-if="toolCall.permission === 'auto_approve'"
        class="tc-badge auto"
      >自动审批</span>
      <span :class="statusClass">{{ statusText }}</span>
      <span class="tc-toggle">{{ collapsed ? '▸ 详情' : '▾ 收起' }}</span>
    </div>
    <div class="tc-args">
      参数: <code>{{ JSON.stringify(toolCall.args) }}</code>
    </div>
    <div
      v-if="result"
      class="tc-result"
      :class="{ 'tc-clamped': hasClamp && !expanded }"
    >
      <img
        v-if="shotMatch"
        :src="shotMatch"
        style="max-width: 100%; border-radius: 8px; margin-top: 8px"
        alt="截图"
      >
      <template v-else>
        结果: {{ result }}
      </template>
    </div>
    <div
      v-if="hasClamp && !shotMatch"
      class="tc-expand"
      @click.stop="expanded = !expanded"
    >
      {{ expanded ? '收起' : '展开' }}
    </div>
    <div
      v-if="approval"
      class="tc-approval"
    >
      <div
        class="tc-approval-desc"
        v-html="descHtml"
      />
    </div>
  </div>
</template>
