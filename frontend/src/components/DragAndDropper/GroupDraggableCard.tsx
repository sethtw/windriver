import { useRef, useCallback } from 'react'
import { type DragSourceMonitor, type DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import DraggableCard, { ItemTypes } from './DraggableCard'
import type { Item } from './DraggableCard'
import './DraggableComponents.css'

interface GroupDraggableCardProps {
  groupId: string
  title: string
  items: Item[]
  moveCard: (dragIndex: number, hoverIndex: number) => void
  transferItem?: (item: Item, targetGroupId: string) => void
  backgroundColor?: string
  renderItem?: (item: Item) => React.ReactNode
}

const GroupDraggableCard = ({ 
  groupId, 
  title, 
  items, 
  moveCard,
  transferItem,
  backgroundColor = '#f8f9fa',
  renderItem
}: GroupDraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const lastMoveRef = useRef<{ dragId: string; targetGroupId: string } | null>(null)
  const lastHoverTimeRef = useRef<number>(0)

  // Throttled transfer function to prevent rapid updates
  const throttledTransferItem = useCallback((draggedItem: any, targetGroupId: string) => {
    const now = Date.now()
    const throttleDelay = 100 // 100ms throttle
    
    // Check if we should throttle this transfer
    if (now - lastHoverTimeRef.current < throttleDelay) {
      return
    }
    
    // Check if we've already moved this item to this target group
    if (lastMoveRef.current?.dragId === draggedItem.id && 
        lastMoveRef.current?.targetGroupId === targetGroupId) {
      return
    }
    
    lastHoverTimeRef.current = now
    lastMoveRef.current = { dragId: draggedItem.id, targetGroupId }
    
    if (transferItem) {
      transferItem(draggedItem, targetGroupId)
    }
  }, [transferItem])

  const [{ }, drag] = useDrag({
    type: ItemTypes.GROUP,
    item: { groupId },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem: any) => {
      if (!ref.current) {
        return
      }
      const sourceGroupId = draggedItem.groupId
      const targetGroupId = groupId

      // If dropping on the same group, let the card handle the drop
      if (sourceGroupId === targetGroupId) {
        return
      }

      // Use throttled transfer function
      throttledTransferItem(draggedItem, targetGroupId)
    },
    drop: () => {
      // Reset the last move reference when the drag operation ends
      lastMoveRef.current = null
      lastHoverTimeRef.current = 0
      return { dropped: true }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      dropResult: monitor.getDropResult(),
      canDrop: monitor.canDrop(),
      isOverCurrent: monitor.isOver({ shallow: false }),
      isOverCurrentShallow: monitor.isOver({ shallow: true }),
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      isOverTarget: monitor.isOver({ shallow: false }),
      isOverTargetShallow: monitor.isOver({ shallow: true }),
      handlerId: monitor.getHandlerId(),
      receiveHandlerId: monitor.receiveHandlerId,
    }),
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