<script setup>
import { ref, computed } from "vue"
import { api } from "../api.js"
import { escapeHtml } from "../utils.js"

const props = defineProps({
  diff: { type: Object, default: () => ({}) },
  tid: { type: String, default: null },
})
const emit = defineEmits(["synced", "reverted"])

const verifyCmd = ref("python -m pytest tests/ -q")
const verified = ref(null)
const verifyResult = ref({ passed: false, output: "", returncode: null })
const syncMsg = ref("")
const busy = ref(false)

const added = computed(() => props.diff.added || [])
const modified = computed(() => props.diff.modified || [])
const deleted = computed(() => props.diff.deleted || [])
const msgClass = computed(() => (syncMsg.value.startsWith("✓") ? "sync-msg sync-ok" : "sync-msg sync-err"))

async function onVerify() {
  if (busy.value || !props.tid) return
  busy.value = true; syncMsg.value = ""; verified.value = null
  try {
    const r = await api.verifyShadow(props.tid, verifyCmd.value)
    verifyResult.value = { passed: !!r.passed, output: r.output || "", returncode: r.returncode ?? null }
    verified.value = !!r.passed
  } catch (e) {
    verifyResult.value = { passed: false, output: escapeHtml(e.message || "验证请求失败"), returncode: -1 }
    verified.value = false
  } finally { busy.value = false }
}

async function onSync() {
  if (busy.value || verified.value === false || !props.tid) return
  busy.value = true; syncMsg.value = ""
  try {
    await api.syncShadow(props.tid, verifyCmd.value)
    syncMsg.value = "✓ 已同步到工作区"
    emit("synced", props.tid)
  } catch (e) {
    syncMsg.value = e.message || "同步失败"
  } finally { busy.value = false }
}

async function onRevert() {
  if (busy.value || !props.tid) return
  busy.value = true; syncMsg.value = ""
  try {
    await api.revertShadow(props.tid)
    syncMsg.value = "✓ 已放弃修改并回退"
    emit("reverted", props.tid)
  } catch (e) {
    syncMsg.value = e.message || "回退失败"
  } finally { busy.value = false }
}
</script>

<template>
  <div class="sync-panel">
    <div class="sync-header">Shadow Workspace 同步</div>
    <div class="sync-summary">
      <span class="sync-tag sync-added">新增 {{ added.length }}</span>
      <span class="sync-tag sync-modified">修改 {{ modified.length }}</span>
      <span class="sync-tag sync-deleted">删除 {{ deleted.length }}</span>
    </div>
    <div class="sync-files">
      <div v-for="f in added" :key="'a' + f" class="sync-file">
        <span class="sf-icon">+</span>
        <span class="sf-name">{{ f }}</span>
      </div>
      <div v-for="f in modified" :key="'m' + f" class="sync-file">
        <span class="sf-icon">~</span>
        <span class="sf-name">{{ f }}</span>
      </div>
      <div v-for="f in deleted" :key="'d' + f" class="sync-file">
        <span class="sf-icon">-</span>
        <span class="sf-name">{{ f }}</span>
      </div>
      <div v-if="added.length + modified.length + deleted.length === 0" class="sync-file">
        <span class="sf-name" style="color:var(--muted);">无变更</span>
      </div>
    </div>
    <div class="sync-verify">
      <div class="sync-verify-cmd">
        <input v-model="verifyCmd" placeholder="验证命令" @keyup.enter="onVerify()" />
        <button class="sync-verify-btn" @click="onVerify()" :disabled="busy">验证</button>
      </div>
      <div v-if="verified !== null" class="sync-verify-result" :class="{ ok: verified, err: !verified }">
        {{ verified ? "✓ 验证通过" : "✗ 验证未通过" }}（返回码 {{ verifyResult.returncode }}）
      </div>
      <pre v-if="verifyResult.output" class="sync-verify-output">{{ verifyResult.output }}</pre>
    </div>
    <div class="sync-actions">
      <button class="sync-btn sync-apply" @click="onSync()" :disabled="busy || verified === false">同步到工作区</button>
      <button class="sync-btn sync-revert" @click="onRevert()" :disabled="busy">放弃修改</button>
    </div>
    <div v-if="syncMsg" :class="msgClass">{{ syncMsg }}</div>
  </div>
</template>
