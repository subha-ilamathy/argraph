import { ReactNode } from 'react'
import { Message } from '@/api/lightrag'
import useTheme from '@/hooks/useTheme'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeReact from 'rehype-react'
import remarkMath from 'remark-math'

import type { Element } from 'hast'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { LoaderIcon, CopyIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type MessageWithError = Message & {
  isError?: boolean
  isStreaming?: boolean
}

export const ChatMessage = ({ message }: { message: MessageWithError }) => {
  const { t } = useTranslation()
  const isChainOfThought = message.content?.startsWith('[Chain of Thought]:')

  if (message.role === 'assistant' && message.isStreaming && !message.content) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoaderIcon className="h-4 w-4 animate-spin" />
        <span>{t('retrievePanel.retrieval.loading')}</span>
      </div>
    )
  }

  const bubbleClass = cn(
    'max-w-[80%] rounded-lg px-4 py-2 flex items-start gap-2',
    message.role === 'user'
      ? 'bg-primary text-primary-foreground'
      : message.isError
        ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
        : isChainOfThought
          ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          : 'bg-muted'
  )

  const handleCopyMarkdown = async () => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content)
      } catch (err) {
        console.error(t('chat.copyError'), err)
      }
    }
  }

  return (
    <div className={bubbleClass}>
      {message.role === 'assistant' && message.isStreaming && (
        <div className="flex items-center gap-1">
          <LoaderIcon className="mt-1 h-4 w-4 animate-spin text-muted-foreground" />
          <span className="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400">🧠</span>
        </div>
      )}
      {!message.isStreaming && message.role === 'assistant' && isChainOfThought && (
        <span className="mt-1 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400">🧠</span>
      )}
      <div className="relative break-words whitespace-pre-wrap">
        <ReactMarkdown
          className="dark:prose-invert max-w-none text-base text-sm"
          remarkPlugins={[remarkGfm, remarkMath]}
          skipHtml={false}
          components={{
            code: CodeHighlight,
            ol: ({ children }) => (
              <ol
                style={{
                  paddingLeft: '1.5rem',
                  listStyleType: 'decimal',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: '0.25rem' }}>{children}</li>
            )
          }}
        >
          {message.content}
        </ReactMarkdown>

        {message.role === 'assistant' && message.content.length > 0 && !message.isStreaming && (
          <Button
            onClick={handleCopyMarkdown}
            className="absolute right-0 bottom-0 size-6 rounded-md opacity-20 transition-opacity hover:opacity-100"
            tooltip={t('retrievePanel.chatMessage.copyTooltip')}
            variant="default"
            size="icon"
          >
            <CopyIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

interface CodeHighlightProps {
  inline?: boolean
  className?: string
  children?: ReactNode
  node?: Element
}

const isInlineCode = (node: Element): boolean => {
  const textContent = (node.children || [])
    .filter((child) => child.type === 'text')
    .map((child) => (child as any).value)
    .join('')

  return !textContent.includes('\n')
}

const CodeHighlight = ({ className, children, node, ...props }: CodeHighlightProps) => {
  const { theme } = useTheme()
  const match = className?.match(/language-(\w+)/)
  const language = match ? match[1] : undefined
  const inline = node ? isInlineCode(node) : false

  return !inline ? (
    <SyntaxHighlighter
      style={theme === 'dark' ? oneDark : oneLight}
      PreTag="div"
      language={language}
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code
      className={cn(className, 'mx-1 rounded-xs bg-black/10 px-1 dark:bg-gray-100/20')}
      {...props}
    >
      {children}
    </code>
  )
}
