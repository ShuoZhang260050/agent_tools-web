<script setup>
defineProps({
  currentTid: { type: String, default: null },
  currentUser: { type: String, default: "" },
})
defineEmits(["logout"])
</script>

<template>
  <div class="header">
    <span>Agent Chat</span>
    <span v-if="currentTid" style="font-weight:400;color:var(--muted);font-size:12px;">· {{ currentTid.slice(0, 8) }}</span>
    <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
      <span style="color:var(--muted);font-size:13px;">{{ currentUser }}</span>
      <button @click="$emit('logout')" style="font-size:12px;color:var(--accent);border:none;background:none;cursor:pointer;">退出</button>
    </div>
  </div>
</template>
