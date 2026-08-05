<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { modelShortName } from '../utils.js'
import { store, PERMISSION_CHOICES } from '../store.js'

const props = defineProps({
  currentTid: { type: String, default: null },
  currentUser: { type: String, default: '' },
  availableModels: { type: Array, default: () => [] },
  currentModel: { type: String, default: '' },
  currentPermission: { type: String, default: 'request_approval' },
})
const emit = defineEmits(['logout', 'select-model', 'select-permission'])

const modelOpen = ref(false)
const permOpen = ref(false)
const currentPerm = computed(
  () => store.permissionChoices.find((p) => p.value === props.currentPermission) || PERMISSION_CHOICES[0]
)

function toggleModel() {
  modelOpen.value = !modelOpen.value
  permOpen.value = false
}
function togglePerm() {
  permOpen.value = !permOpen.value
  modelOpen.value = false
}
function selectPermission(value) {
  permOpen.value = false
  emit('select-permission', value)
}
function selectModel(value) {
  modelOpen.value = false
  emit('select-model', value)
}
function onDocClick() {
  modelOpen.value = false
  permOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="header">
    <span class="h-title">Agent Chat</span>
    <span
      v-if="currentTid"
      class="h-tid"
    >· {{ currentTid.slice(0, 8) }}</span>
    <div class="header-pickers">
      <div
        class="model-picker"
        :class="{ open: modelOpen }"
        @click.stop
      >
        <button
          class="model-button"
          type="button"
          @click="toggleModel"
        >
          <span class="model-short">{{ modelShortName(currentModel) }}</span>
          <span class="caret">▾</span>
        </button>
        <div class="model-menu">
          <div
            v-for="m in availableModels"
            :key="m.name"
            class="model-option"
            :class="{ active: m.name === currentModel }"
            @click="selectModel(m.name)"
          >
            <div class="model-name">
              {{ m.name }}
            </div>
            <div class="model-meta">
              {{ modelShortName(m.name) }}{{ m.vision ? ' · 支持图片' : ' · 仅文本' }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="permission-picker"
        :class="{ open: permOpen }"
        @click.stop
      >
        <button
          class="permission-button"
          type="button"
          @click="togglePerm"
        >
          <span
            class="perm-dot"
            :style="{ background: currentPerm.color }"
          />
          <span class="perm-label">{{ currentPerm.label }}</span>
          <span class="perm-caret">▾</span>
        </button>
        <div class="permission-menu">
          <div
            v-for="p in store.permissionChoices"
            :key="p.value"
            class="permission-option"
            :class="{ active: p.value === currentPermission }"
            @click="selectPermission(p.value)"
          >
            <span
              class="perm-dot"
              :style="{ background: p.color }"
            />
            <div class="perm-text">
              <div class="perm-name">
                {{ p.label }}
              </div>
              <div class="perm-desc">
                {{ p.desc }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="h-right">
      <span class="h-user">{{ currentUser }}</span>
      <button
        class="h-logout"
        @click="$emit('logout')"
      >
        退出
      </button>
    </div>
  </div>
</template>
