import { MessageWithError } from '@/components/retrieval/ChatMessage'

export async function handleStreamedQuery(
  queryRequest: any,
  addMessage: (msg: MessageWithError) => void,
  endMessage?: () => void
) {
  const response = await fetch('/query/stream', {
    method: 'POST',
    body: JSON.stringify(queryRequest),
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.body) {
    console.error('Streamed response body is null')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line)
        if (parsed.response) {
          const content = parsed.response.trim()

          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content,
            isError: false,
            isStreaming: true
          })
        } else if (parsed.error) {
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `⚠️ ${parsed.error}`,
            isError: true,
            isStreaming: false
          })
        }
      } catch (err) {
        console.warn('Could not parse chunk:', line)
      }
    }
  }

  if (endMessage) endMessage()
}
