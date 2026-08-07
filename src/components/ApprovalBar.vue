<script setup>
defineProps({
  count: { type: Number, default: 0 },
})
const emit = defineEmits(['approve', 'deny'])
</script>

<template>
  <div
    v-if="count > 0"
    class="approval-bar"
  >
    <div class="ab-info">
      <span class="ab-count">{{ count }} 项操作待审批</span>
    </div>
    <div class="ab-actions">
      <button
        class="ab-deny"
        @click="emit('deny')"
      >
        取消
      </button>
      <button
        class="ab-approve"
        @click="emit('approve')"
      >
        确认执行
      </button>
    </div>
  </div>
</template>
