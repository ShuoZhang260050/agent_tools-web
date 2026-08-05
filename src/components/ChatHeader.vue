<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { modelShortName } from "../utils.js"
import { PERMISSION_CHOICES } from "../store.js"

const props = defineProps({
  currentTid: { type: String, default: null },
  currentUser: { type: String, default: "" },
  workspace: { type: String, default: "" },
  availableModels: { type: Array, default: () => [] },
  currentModel: { type: String, default: "" },
  currentPermission: { type: String, default: "request_approval" },
  traceVisible: { type: Boolean, default: false },
})
const emit = defineEmits(["select-model", "select-permission", "open-workspace", "toggle-trace", "logout"])

const modelOpen = ref(false)
const permOpen = ref(false)

const currentPerm = computed(() => PERMISSION_CHOICES.find((p) => p.value === props.currentPermission) || PERMISSION_CHOICES[0])

function toggleModel() { modelOpen.value = !modelOpen.value; permOpen.value = false }
function togglePerm() { permOpen.value = !permOpen.value; modelOpen.value = false }
function pickModel(name) { modelOpen.value = false; emit("select-model", name) }
function pickPermission(value) { permOpen.value = false; emit("select-permission", value) }

function onDocClick() { modelOpen.value = false; permOpen.value = false }
onMounted(() => document.addEventListener("click", onDocClick))
onUnmounted(() => document.removeEventListener("click", onDocClick))
</script>

<template>
  <div class="header">
    <div class="model-picker" @click.stop>
      <button class="model-button" @click="toggleModel">
        <span class="model-short">{{ modelShortName(currentModel) }}</span>
        <span class="caret">▾</span>
      </button>
      <div v-if="modelOpen" class="model-menu">
        <div v-for="m in availableModels" :key="m" class="model-option"
             :class="{ active: m === currentModel }" @click="pickModel(m)">
          {{ m }}
        </div>
      </div>
    </div>
    <div class="permission-picker" @click.stop>
      <button class="permission-button" @click="togglePerm">
        <span class="perm-dot" :class="currentPermission"></span>
        <span class="perm-label">{{ currentPerm.label }}</span>
        <span class="perm-caret">▾</span>
      </button>
      <div v-if="permOpen" class="permission-menu">
        <div v-for="p in PERMISSION_CHOICES" :key="p.value" class="permission-option"
             :class="{ active: p.value === currentPermission }" @click="pickPermission(p.value)">
          <span class="perm-dot" :class="p.value"></span>
          <div class="perm-text">
            <div class="perm-name">{{ p.label }}</div>
            <div class="perm-desc">{{ p.desc }}</div>
          </div>
        </div>
      </div>
    </div>
    <button class="ws-btn" @click="emit('open-workspace')" :title="workspace">
      {{ workspace ? "📁 " + workspace : "📁 工作区" }}
    </button>
    <button class="trace-btn" :class="{ active: traceVisible }" @click="emit('toggle-trace')">
      {{ traceVisible ? "🔴 Trace ON" : "⚪ Trace" }}
    </button>
    <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
      <span style="color:var(--muted);font-size:13px;">{{ currentUser }}</span>
      <button @click="emit('logout')">登出</button>
    </div>
  </div>
</template>
