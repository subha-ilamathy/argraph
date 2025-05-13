import { useCallback, useState } from 'react'
import { Message } from '@/api/lightrag'
import useTheme from '@/hooks/useTheme'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { CopyIcon, DownloadIcon, FilterIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface PaperResult {
  id: string
  title: string
  url: string
  authors: string
  date: string
  journal: string
  citationCount: number
  pdfUrl?: string
  insight: string
  tldr: string
}

const CodeHighlight = ({ className, children }: { className?: string; children?: any }) => {
  const { theme } = useTheme()
  const match = className?.match(/language-(\w+)/)
  const language = match ? match[1] : undefined
  return (
    <SyntaxHighlighter
      style={theme === 'dark' ? oneDark : oneLight}
      PreTag="div"
      language={language}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  )
}

const PaperResultTableWithChat = ({
  aiMessage,
  papers
}: {
  aiMessage: Message
  papers: PaperResult[]
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'date'>('relevance')

  const handleCopyMarkdown = useCallback(async () => {
    if (aiMessage.content) {
      try {
        await navigator.clipboard.writeText(aiMessage.content)
      } catch (err) {
        console.error('Copy error', err)
      }
    }
  }, [aiMessage])

  return (
    <div className="w-full space-y-4">
      {/* Top AI Chat message */}
      <div className="bg-muted rounded-lg px-4 py-3 text-sm">
        <pre className="whitespace-pre-wrap break-words relative">
          <ReactMarkdown
            className="dark:prose-invert prose max-w-none text-sm"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{ code: CodeHighlight }}
          >
            {aiMessage.content}
          </ReactMarkdown>
          <Button
            onClick={handleCopyMarkdown}
            className="absolute right-1 bottom-1 size-6 rounded-md opacity-20 hover:opacity-100"
            variant="ghost"
            size="icon"
          >
            <CopyIcon />
          </Button>
        </pre>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="outline" className="flex gap-1 items-center">
            <FilterIcon size={16} /> Filters
          </Button>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="relevance">Sort by: Relevance</option>
            <option value="citations">Citation Count</option>
            <option value="date">Newest First</option>
          </select>
        </div>
        <Button size="sm" variant="ghost" className="text-xs flex gap-1">
          <DownloadIcon size={16} /> CSV
        </Button>
      </div>

      {/* Table headers */}
      <div className="grid grid-cols-3 gap-4 border-y py-2 font-semibold text-gray-700 dark:text-gray-300">
        <div>Papers</div>
        <div>Insights</div>
        <div>TL;DR</div>
      </div>

      {/* Paper rows */}
      {papers.map((paper) => (
        <div
          key={paper.id}
          className="grid grid-cols-3 gap-4 border-b py-4 items-start text-sm"
        >
          <div className="flex flex-col gap-1">
            <a href={paper.url} className="font-medium text-primary hover:underline">
              {paper.title}
            </a>
            <div className="text-xs text-muted-foreground">{paper.authors}</div>
            <div className="text-xs text-muted-foreground">
              {paper.date} · {paper.journal}
            </div>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span>{paper.citationCount} Citations</span>
              {paper.pdfUrl && <a href={paper.pdfUrl} className="text-red-500 font-semibold">PDF</a>}
              <Button size="xs" variant="ghost" className="text-blue-600 p-0 h-auto">
                Ask a Question
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {paper.insight}
          </div>

          <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {paper.tldr}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PaperResultTableWithChat
