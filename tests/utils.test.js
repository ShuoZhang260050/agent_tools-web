import { describe, test, expect } from 'vitest'
import {
  escapeHtml,
  renderMarkdown,
  formatFileSize,
  fileTypeName,
  modelShortName,
  describeToolCall,
} from '../src/utils.js'

describe('escapeHtml', () => {
  test('escapes special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
  test('handles non-string input', () => {
    expect(escapeHtml(123)).toBe('123')
  })
})

describe('renderMarkdown', () => {
  test('renders bold', () => {
    const html = renderMarkdown('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })
  test('sanitizes script tags', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
  })
  test('null input returns empty fallback', () => {
    const html = renderMarkdown(null)
    expect(html).toBe('')
  })
})

describe('formatFileSize', () => {
  test('formats bytes, KB, MB', () => {
    expect(formatFileSize(500)).toBe('500B')
    expect(formatFileSize(1024)).toBe('1.00KB')
    expect(formatFileSize(1048576)).toBe('1.00MB')
  })
  test('handles falsy', () => {
    expect(formatFileSize(null)).toBe('')
    expect(formatFileSize(0)).toBe('')
  })
})

describe('fileTypeName', () => {
  test('extracts extension uppercase', () => {
    expect(fileTypeName('test.py')).toBe('PY')
    expect(fileTypeName('doc.md')).toBe('MD')
  })
  test('returns FILE for no extension', () => {
    expect(fileTypeName('Makefile')).toBe('FILE')
  })
})

describe('modelShortName', () => {
  test('GLM prefix', () => {
    expect(modelShortName('glm-4-flash')).toBe('GLM 4-flash')
  })
  test('DeepSeek', () => {
    expect(modelShortName('deepseek-coder')).toBe('DeepSeek')
  })
  test('truncates long names', () => {
    expect(modelShortName('very-long-model-name')).toBe('very-long-m…')
  })
})

describe('describeToolCall', () => {
  test('run_command', () => {
    const html = describeToolCall('run_command', { command: 'ls -la' })
    expect(html).toContain('执行命令')
    expect(html).toContain('ls -la')
  })
  test('write_file', () => {
    const html = describeToolCall('write_file', { path: 'test.py' })
    expect(html).toContain('写入文件')
    expect(html).toContain('test.py')
  })
  test('unknown tool falls through to default', () => {
    const html = describeToolCall('custom_tool', { x: 1 })
    expect(html).toContain('custom_tool')
  })
  test('escapes args to prevent XSS', () => {
    const html = describeToolCall('test', { x: '<b>' })
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('"<b>"')
  })
})
