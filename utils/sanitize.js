export function stripAtMentions(str = '') {
  // Remove standalone @mentions like "@name" while preserving emails (no leading space)
  return String(str)
    .replace(/(^|\s)@[^\s.,;:!?)\]}]+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function sanitizePromptFields({ title = '', content = '' }) {
  return {
    title: stripAtMentions(title),
    content: stripAtMentions(content)
  }
}
