<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close', 'saved'])

const wsBrowsePath = ref('.')
const wsDrives = ref([])
const browseList = ref([])
const currentPath = ref('')
const parentPath = ref(null)
const breadcrumb = ref('')

const selectedDrive = computed({
  get() {
    const cp = currentPath.value.toUpperCase()
    return wsDrives.value.find((d) => cp.startsWith(d.toUpperCase())) || wsDrives.value[0] || ''
  },
  set(val) {
    if (val) browse(val)
  },
})

async function loadDrives() {
  try {
    const data = await api.getDrives()
    wsDrives.value = data.drives || []
  } catch (e) {
    breadcrumb.value = '加载盘符失败: ' + e.message
  }
}

async function browse(path) {
  wsBrowsePath.value = path
  try {
    const data = await api.browseWorkspace(path)
    currentPath.value = data.current
    breadcrumb.value = data.current
    parentPath.value = data.parent || null
    browseList.value = data.dirs || []
  } catch (e) {
    breadcrumb.value = '错误: ' + e.message
    browseList.value = []
  }
}

async function init() {
  try {
    const data = await api.getWorkspace()
    wsBrowsePath.value = data.workspace || '.'
  } catch (e) {
    wsBrowsePath.value = '.'
  }
  await loadDrives()
  await browse(wsBrowsePath.value)
}

watch(
  () => props.open,
  (val) => {
    if (val) init()
  },
)

function onInputEnter() {
  const p = currentPath.value.trim()
  if (p) browse(p)
}

async function onOk() {
  const path = currentPath.value.trim()
  if (!path) {
    breadcrumb.value = '请输入路径'
    return
  }
  try {
    const data = await api.setWorkspace(path)
    emit('saved', data.workspace)
    emit('close')
  } catch (e) {
    breadcrumb.value = '错误: ' + e.message
  }
}
</script>

<template>
  <div class="ws-modal" :class="{ open: open }">
    <div class="ws-modal-box">
      <h3>选择工作空间目录</h3>
      <div class="ws-drive-row">
        <label>盘符</label>
        <select class="ws-drive" v-model="selectedDrive">
          <option v-for="d in wsDrives" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <input
        class="ws-input"
        v-model="currentPath"
        placeholder="输入或选择目标目录路径"
        @keydown.enter="onInputEnter"
      />
      <div class="ws-breadcrumb">{{ breadcrumb }}</div>
      <div class="ws-browse-list">
        <div
          v-if="parentPath"
          class="ws-dir-item ws-dir-up"
          @click="browse(parentPath)"
        >
          <span>📁</span> ..
        </div>
        <div
          v-for="d in browseList"
          :key="d.path"
          class="ws-dir-item"
          @click="browse(d.path)"
        >
          <span>📁</span> {{ d.name }}
        </div>
        <div
          v-if="browseList.length === 0 && !parentPath"
          class="ws-empty"
        >
          无子目录
        </div>
      </div>
      <div class="ws-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="onOk">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  align-items: center;
  justify-content: center;
}
.ws-modal.open {
  display: flex;
}
.ws-modal-box {
  background: var(--panel);
  border-radius: 12px;
  padding: 24px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}
.ws-modal-box h3 {
  font-size: 16px;
  margin-bottom: 12px;
}
.ws-drive-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ws-drive-row label {
  font-size: 12px;
  color: var(--muted);
}
.ws-drive {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  background: var(--bg);
  cursor: pointer;
}
.ws-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-family: monospace;
  box-sizing: border-box;
}
.ws-input:focus {
  border-color: var(--accent);
  outline: none;
}
.ws-breadcrumb {
  font-size: 11px;
  color: var(--muted);
  margin: 4px 0;
  word-break: break-all;
}
.ws-browse-list {
  max-height: 240px;
  overflow-y: auto;
  margin: 8px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.ws-dir-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ws-dir-item:hover {
  background: #e8e8ea;
}
.ws-dir-up {
  color: var(--muted);
}
.ws-empty {
  padding: 12px;
  color: var(--muted);
  font-size: 13px;
}
.ws-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
.ws-actions button {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}
.ws-actions button:hover {
  background: #f0f0f2;
}
.ws-actions button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.ws-actions button.primary:hover {
  background: var(--accent-hover);
}
</style>
