import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useRef, useState } from 'react'
import { queryText, queryTextStream, Message } from '@/api/lightrag'
import { errorMessage } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settings'
import { useDebounce } from '@/hooks/useDebounce'
import QuerySettings from '@/components/retrieval/QuerySettings'
import { ChatMessage, MessageWithError } from '@/components/retrieval/ChatMessage'
import { EraserIcon, SendIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { handleStreamedQuery } from '@/api/handleStreamedQuery'

export default function RetrievalTesting() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageWithError[]>(
    () => useSettingsStore.getState().retrievalHistory || []
  )
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const addMessage = useCallback((msg: MessageWithError) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim() || isLoading) return

      const userMessage: MessageWithError = {
        id: crypto.randomUUID(),
        content: inputValue,
        role: 'user',
        isError: false
      }

      const prevMessages = [...messages, userMessage]
      setMessages(prevMessages)
      setInputValue('')
      setIsLoading(true)

      const state = useSettingsStore.getState()
      const queryParams = {
        ...state.querySettings,
        query: userMessage.content,
        conversation_history: prevMessages
          .filter((m) => m.isError !== true)
          .map((m) => ({ role: m.role, content: m.content }))
      }

      try {
        if (state.querySettings.stream) {
          await handleStreamedQuery(
            queryParams,
            (chunkMsg) => addMessage(chunkMsg),
            () => useSettingsStore.getState().setRetrievalHistory([...prevMessages])
          )
        } else {
          const response = await queryText(queryParams)
          const assistantMessage: MessageWithError = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.response,
            isStreaming: false
          }
          setMessages((prev) => [...prev, assistantMessage])
        }
      } catch (err) {
        const errMsg: MessageWithError = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `${t('retrievePanel.retrieval.error')}
${errorMessage(err)}`,
          isError: true
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [inputValue, isLoading, messages, t, addMessage]
  )

  const debouncedMessages = useDebounce(messages, 100)
  useEffect(() => scrollToBottom(), [debouncedMessages, scrollToBottom])

  const clearMessages = useCallback(() => {
    setMessages([])
    useSettingsStore.getState().setRetrievalHistory([])
  }, [setMessages])

  return (
    <div className="flex size-full gap-2 px-2 pb-12 overflow-hidden">
      <div className="flex grow flex-col gap-4">
        <div className="relative grow">
          <div className="bg-primary-foreground/60 absolute inset-0 flex flex-col overflow-auto rounded-lg border p-2">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center text-lg">
                  {t('retrievePanel.retrieval.startPrompt')}
                </div>
              ) : (
                messages.map((message, idx) => (
                  <div
                    key={message.id || idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <ChatMessage message={message} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="pb-1" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearMessages}
            disabled={isLoading}
            size="sm"
          >
            <EraserIcon />
            {t('retrievePanel.retrieval.clear')}
          </Button>
          <Input
            className="flex-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('retrievePanel.retrieval.placeholder')}
            disabled={isLoading}
          />
          <Button type="submit" variant="default" disabled={isLoading} size="sm">
            <SendIcon />
            {t('retrievePanel.retrieval.send')}
          </Button>
        </form>
      </div>
      {/* <QuerySettings /> */}
    </div>
  )
}
