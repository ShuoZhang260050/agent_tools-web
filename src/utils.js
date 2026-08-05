import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.use({ breaks: true, gfm: true })

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))
}

export function renderMarkdown(text) {
  const fallback = escapeHtml(text || '').replace(/\n/g, '<br>')
  try {
    let html = marked.parse(text || '')
    html = html.replace(/\/screenshots\/screenshot_[a-f0-9]+\.png/g, '<img src="$&" style="max-width:100%;border-radius:8px;margin-top:8px;" alt="截图">')
    return DOMPurify.sanitize(html)
  } catch (e) {
    return fallback
  }
}

export function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + 'KB'
  return (bytes / 1048576).toFixed(2) + 'MB'
}

export function fileTypeName(name) {
  const parts = (name || '').split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE'
}

export function modelShortName(name) {
  const lower = (name || '').toLowerCase()
  if (lower.startsWith('glm-')) return 'GLM ' + name.slice(4)
  if (lower.includes('doubao-seed-2.0-code')) return 'DB 2.0 Code'
  if (lower.includes('doubao-seed-2.0-pro')) return 'DB 2.0 Pro'
  if (lower.includes('doubao-seed-code')) return 'DB Code'
  if (lower.includes('deepseek')) return 'DeepSeek'
  if (lower.includes('kimi')) return 'Kimi'
  return name.length > 12 ? name.slice(0, 11) + '…' : name
}

export function describeToolCall(name, args) {
  args = args || {}
  const trunc = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n) + '…' : s }
  switch (name) {
    case 'run_command':
      return `<b>执行命令</b>：<code>${escapeHtml(trunc(args.command || '', 300))}</code>`
    case 'run_python':
      return `<b>执行 Python 代码</b>：<code>${escapeHtml(trunc((args.code || '').replace(/\n/g, ' '), 300))}</code>`
    case 'write_file':
      return `<b>写入文件</b>：<code>${escapeHtml(args.path || '')}</code>`
    case 'edit_file':
      return `<b>编辑文件</b>：<code>${escapeHtml(args.path || '')}</code>`
    case 'download_file':
      return `<b>下载文件</b>：${escapeHtml(trunc(args.url || '', 200))}`
    case 'http_request':
      return `<b>HTTP 请求</b>：${escapeHtml(args.method || 'GET')} ${escapeHtml(trunc(args.url || '', 200))}`
    case 'browser':
      return `<b>浏览器操作</b>：${escapeHtml(args.action || JSON.stringify(args))}`
    case 'save_memory':
      return `<b>保存记忆</b>：${escapeHtml(args.key || '')}`
    default:
      return `<b>${escapeHtml(name)}</b>：<code>${escapeHtml(trunc(JSON.stringify(args), 300))}</code>`
  }
}
