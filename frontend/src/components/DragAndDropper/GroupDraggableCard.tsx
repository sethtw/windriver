import { useRef, useCallback } from 'react'
import { type DragSourceMonitor, type DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import DraggableCard, { ItemTypes } from './DraggableCard'
import type { Item } from './DraggableCard'
import { useThrottledOperation, createSimpleDropCollect, type DragItem } from '../../utils/dragAndDropUtils'
import './DraggableComponents.css'

interface GroupDraggableCardProps {
  groupId: string
  title: string
  items: Item[]
  moveCard: (id: string, atIndex: number) => void
  findCard: (id: string) => { card: Item; index: number }
  transferItem?: (item: Item, targetGroupId: string) => void
  backgroundColor?: string
  renderItem?: (item: Item) => React.ReactNode
}

const GroupDraggableCard = ({ 
  groupId, 
  title, 
  items, 
  moveCard,
  findCard,
  transferItem,
  backgroundColor = '#f8f9fa',
  renderItem
}: GroupDraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { throttledOperation, resetThrottle } = useThrottledOperation()

  // Throttled transfer function
  const throttledTransferItem = useCallback((draggedItem: DragItem, targetGroupId: string) => {
    throttledOperation(
      () => transferItem?.(draggedItem, targetGroupId),
      `transfer-${draggedItem.id}-${targetGroupId}`
    )
  }, [transferItem, throttledOperation])

  const [{ }, drag] = useDrag({
    type: ItemTypes.GROUP,
    item: { groupId },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem: DragItem) => {
      if (!ref.current) return
      
      const sourceGroupId = draggedItem.groupId
      const targetGroupId = groupId

      // If dropping on the same group, let the card handle the drop
      if (sourceGroupId === targetGroupId) return

      // Use throttled transfer function
      throttledTransferItem(draggedItem, targetGroupId)
    },
    drop: () => {
      resetThrottle()
      return { dropped: true }
    },
    collect: (monitor: DropTargetMonitor) => createSimpleDropCollect().isOver(monitor),
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      className="group-draggable-card"
      style={{
        backgroundColor,
        borderRadius: 12,
        padding: 20,
        margin: 16,
        minHeight: 200,
        width: '100%',
        border: isOver ? '3px dashed #007bff' : '2px solid #dee2e6',
        transition: 'all 0.2s ease',
        boxShadow: isOver ? '0 4px 12px rgba(0,123,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{
        margin: '0 0 16px 0',
        color: '#495057',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottom: '2px solid #dee2e6',
        paddingBottom: '8px'
      }}>
        {title} ({items.length})
      </h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 100,
      }}>
        {items.length === 0 ? (
          <div style={{
            color: '#6c757d',
            fontSize: '0.9rem',
            textAlign: 'center',
            padding: '20px',
            fontStyle: 'italic'
          }}>
            Drop cards here
          </div>
        ) : (
          items.map((item, index) => (
            <DraggableCard
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              moveCard={moveCard}
              findCard={findCard}
              groupId={groupId}
              renderItem={renderItem}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default GroupDraggableCard 