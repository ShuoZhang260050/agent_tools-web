<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import ToolCard from './ToolCard.vue'
import SyncPanel from './SyncPanel.vue'
import { renderMarkdown, escapeHtml, describeToolCall } from '../utils.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  typing: { type: Boolean, default: false },
})

const emit = defineEmits(['approve', 'deny', 'synced', 'reverted'])

const messagesEl = ref(null)

function scrollBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

watch(() => props.items.length, () => nextTick(scrollBottom))
watch(() => props.typing, () => nextTick(scrollBottom))

defineExpose({ scrollBottom })
</script>

<template>
  <div class="messages" ref="messagesEl">
    <template v-for="(item, i) in items" :key="i">
      <!-- Chat message -->
      <div v-if="item.type === 'message'" class="msg" :class="item.role">
        <div v-if="item.file" class="file-card" @click="item.file.onClick">
          <div class="fc-name">{{ item.file.name }}</div>
          <div class="fc-meta">{{ item.file.type }} {{ item.file.size }}</div>
        </div>
        <div class="role-label">{{ item.role === 'user' ? '你' : 'Agent' }}</div>
        <div v-if="item.markdown" class="bubble markdown" v-html="renderMarkdown(item.content)"></div>
        <div v-else class="bubble">{{ item.content }}</div>
        <img v-if="item.image" :src="item.image" style="max-width:100%;max-height:300px;border-radius:8px;margin-top:8px;" />
      </div>

      <!-- Tool card -->
      <ToolCard
        v-else-if="item.type === 'tool_card' && !item.hidden'"
        :tool-call="item.toolCall"
        :status="item.status"
        :result="item.result"
        :approval="item.approval"
        @approve="(id) => emit('approve', id)"
        @deny="(id) => emit('deny', id)"
      />

      <!-- Sync panel -->
      <div v-else-if="item.type === 'sync_panel'" class="msg assistant">
        <SyncPanel
          :diff="item.diff"
          :tid="item.tid"
          @synced="emit('synced')"
          @reverted="emit('reverted')"
        />
      </div>
    </template>

    <!-- Typing indicator -->
    <div v-if="typing" class="msg assistant">
      <div class="role-label">Agent</div>
      <div class="bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  </div>
</template>
