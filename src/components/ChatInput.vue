<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  sending: { type: Boolean, default: false },
  approvalPending: { type: Boolean, default: false },
  syncPending: { type: Boolean, default: false },
})
const emit = defineEmits(['send', 'abort', 'upload-rag'])

const inputText = ref('')
const history = ref([])
const historyIndex = ref(-1)
const currentImage = ref(null)
const currentFileName = ref(null)
const currentFileText = ref(null)
const currentFileSize = ref(null)
const attachmentOpen = ref(false)
const imageInput = ref(null)
const fileInput = ref(null)
const ragInput = ref(null)

const sendDisabled = computed(() => props.approvalPending || props.syncPending)

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    doSend()
    return
  }
  if (e.key === 'ArrowUp' && (e.target.selectionStart === 0 || !inputText.value)) {
    e.preventDefault()
    navigateHistory(-1, e.target)
  } else if (e.key === 'ArrowDown' && (e.target.selectionStart === inputText.value.length || !inputText.value)) {
    e.preventDefault()
    navigateHistory(1, e.target)
  }
}

function navigateHistory(dir, el) {
  if (history.value.length === 0) return
  if (dir === -1) {
    if (historyIndex.value === -1) historyIndex.value = history.value.length - 1
    else if (historyIndex.value > 0) historyIndex.value--
    else return
  } else {
    if (historyIndex.value === -1) return
    if (historyIndex.value < history.value.length - 1) historyIndex.value++
    else {
      historyIndex.value = -1
      inputText.value = ''
      nextTick(() => resizeTextarea(el))
      return
    }
  }
  inputText.value = history.value[historyIndex.value]
  nextTick(() => resizeTextarea(el))
}

function resizeTextarea(el) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function onInput(e) {
  if (e.target) resizeTextarea(e.target)
}

function doSend() {
  const text = inputText.value.trim()
  if (
    (!text && !currentImage.value && !currentFileText.value) ||
    props.sending ||
    props.approvalPending ||
    props.syncPending
  )
    return
  if (text && text !== history.value[history.value.length - 1]) {
    history.value.push(text)
  }
  historyIndex.value = -1
  const body = { message: text || '' }
  if (currentImage.value) body.image = currentImage.value
  if (currentFileText.value) {
    body.attachment_text = currentFileText.value
    body.attachment_name = currentFileName.value
  }
  emit('send', body)
  inputText.value = ''
  clearImage()
  clearFile()
}

function onSendClick() {
  if (props.sending) {
    emit('abort')
    return
  }
  doSend()
}

function onAttachmentClick(kind) {
  attachmentOpen.value = false
  if (kind === 'image') imageInput.value?.click()
  else if (kind === 'attach') fileInput.value?.click()
  else if (kind === 'rag') ragInput.value?.click()
}

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    currentImage.value = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function clearImage() {
  currentImage.value = null
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    alert('文件超过 10MB，建议使用「入知识库」。')
    e.target.value = ''
    return
  }
  const isText = /\.(txt|md|markdown|csv|json|log)$/i.test(file.name)
  if (isText) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      let text
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(ev.target.result)
      } catch {
        text = new TextDecoder('gbk').decode(ev.target.result)
      }
      currentFileText.value = text
      currentFileName.value = file.name
      currentFileSize.value = file.size
    }
    reader.readAsArrayBuffer(file)
  } else {
    const formData = new FormData()
    formData.append('file', file)
    api
      .extractText(formData)
      .then((data) => {
        currentFileText.value = data.text
        currentFileName.value = data.filename
        currentFileSize.value = new Blob([data.text]).size
      })
      .catch((err) => {
        alert('文件解析失败: ' + err.message)
      })
  }
  e.target.value = ''
}

function clearFile() {
  currentFileText.value = null
  currentFileName.value = null
  currentFileSize.value = null
}

function onRagChange(e) {
  const file = e.target.files[0]
  if (!file) return
  emit('upload-rag', file)
  e.target.value = ''
}

function onPaste(e) {
  const items = (e.clipboardData || {}).items || []
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        currentImage.value = ev.target.result
      }
      reader.readAsDataURL(file)
      break
    }
  }
}

function toggleAttachment() {
  attachmentOpen.value = !attachmentOpen.value
}
function onDocClick() {
  attachmentOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="input-bar">
    <div
      v-if="currentImage"
      class="image-preview"
      style="display: block"
    >
      <img :src="currentImage">
      <button
        class="remove-img"
        @click="clearImage()"
      >
        ✕
      </button>
    </div>
    <div
      v-if="currentFileName"
      class="file-preview"
      style="display: block"
    >
      <div class="fp-name">
        {{ currentFileName }}
      </div>
      <div class="fp-snippet">
        {{ (currentFileText || '').slice(0, 200) }}
      </div>
      <button
        class="fp-remove"
        @click="clearFile()"
      >
        ✕
      </button>
    </div>
    <div class="input-wrap">
      <input
        ref="imageInput"
        type="file"
        style="display: none"
        accept="image/*"
        @change="onImageChange"
      >
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        accept=".txt,.md,.markdown,.pdf,.csv,.json,.log"
        @change="onFileChange"
      >
      <input
        ref="ragInput"
        type="file"
        style="display: none"
        accept=".txt,.md,.markdown,.pdf,.doc,.docx"
        @change="onRagChange"
      >
      <div
        class="attachment-picker"
        :class="{ open: attachmentOpen }"
        @click.stop
      >
        <button
          class="attachment-btn"
          type="button"
          title="上传附件"
          @click="toggleAttachment"
        >
          +
        </button>
        <div class="attachment-menu">
          <button
            class="attachment-option"
            type="button"
            @click="onAttachmentClick('image')"
          >
            上传图片
          </button>
          <button
            class="attachment-option"
            type="button"
            @click="onAttachmentClick('attach')"
          >
            附加文件
          </button>
          <button
            class="attachment-option"
            type="button"
            @click="onAttachmentClick('rag')"
          >
            入知识库
          </button>
        </div>
      </div>
      <textarea
        v-model="inputText"
        class="msg-input"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        rows="1"
        @keydown="onKeydown"
        @input="onInput"
        @paste="onPaste"
      />
      <button
        class="send-btn"
        :class="{ 'stop-mode': sending }"
        :disabled="sendDisabled && !sending"
        @click="onSendClick"
      >
        {{ sending ? '■' : '➤' }}
      </button>
    </div>
  </div>
</template>
