import { useEffect, useState } from 'react'
import { useGraphStore } from '@/stores/graph'
import Button from '@/components/ui/Button'

interface Topic {
  id: string
  label: string
  entity_type: string
  color: string
  degree: number
}

const INITIAL_LIMIT = 5
const MINIMUM_DEGREE = 7

const GraphTopics = () => {
  const sigmaGraph = useGraphStore.use.sigmaGraph()
  const rawGraph = useGraphStore.use.rawGraph()  // 🛑 ADD this
  const setSelectedNode = useGraphStore.getState().setSelectedNode
  const [groupedTopics, setGroupedTopics] = useState<Record<string, Topic[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!sigmaGraph || !rawGraph) return

    const nodes = sigmaGraph.nodes().map((id: string) => {
      const label = sigmaGraph.getNodeAttribute(id, 'label') || id
      const rawNode = rawGraph.getNode(id) || {}
      const properties = rawNode.properties || {}
      const color = sigmaGraph.getNodeAttribute(id, 'color') || '#d1d5db'
      const degree = sigmaGraph.degree(id) || 0

      const entity_type = properties.entity_type || 'Other'

      return { id, label, entity_type, color, degree }
    })

    const filtered = nodes
      .filter((node) => node.degree >= MINIMUM_DEGREE)
      .sort((a, b) => b.degree - a.degree)

    const grouped: Record<string, Topic[]> = {}
    filtered.forEach(({ id, label, entity_type, color, degree }) => {
      if (!grouped[entity_type]) {
        grouped[entity_type] = []
      }
      grouped[entity_type].push({ id, label, entity_type, color, degree })
    })

    Object.keys(grouped).forEach((group) => {
      grouped[group].sort((a, b) => a.label.localeCompare(b.label))
    })

    setGroupedTopics(grouped)
  }, [sigmaGraph, rawGraph])

  const handleTopicClick = (id: string) => {
    setSelectedNode(id, true)
  }

  const handleShowMore = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: true
    }))
  }

  return (
    <div className="flex flex-col gap-4 max-h-96 overflow-auto p-2 rounded bg-background/60 backdrop-blur-md border">
      {Object.entries(groupedTopics).map(([group, topics]) => (
        <div key={group} className="flex flex-col gap-2">
          <div className="font-semibold text-primary">{group}</div>
          <div className="flex flex-col gap-2">
            {(expandedGroups[group] ? topics : topics.slice(0, INITIAL_LIMIT)).map((topic) => (
              <Button
                key={topic.id}
                size="sm"
                style={{
                  backgroundColor: topic.color,
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  justifyContent: 'flex-start'
                }}
                onClick={() => handleTopicClick(topic.id)}
                className="w-full text-left hover:opacity-80"
              >
                {topic.label}
              </Button>
            ))}
            {topics.length > INITIAL_LIMIT && !expandedGroups[group] && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs underline"
                onClick={() => handleShowMore(group)}
              >
                + More
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GraphTopics
