import { useRef, useCallback } from 'react'
import { type DragSourceMonitor, type DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import './DraggableComponents.css'

export interface Item {
  id: string
  text: string
  color: string
  groupId: string
  // Add optional properties for extensibility
  audioFile?: any // AudioFile or any future file type
  metadata?: Record<string, any> // For additional metadata
}

export const ItemTypes = {
  CARD: 'card',
  GROUP: 'group'
}

interface DraggableCardProps {
  item: Item
  index: number
  moveCard: (dragIndex: number, hoverIndex: number) => void
  groupId: string
  transferItem?: (item: Item, targetGroupId: string) => void
  isSingleItemGroup?: boolean
  renderItem?: (item: Item) => React.ReactNode
}

// Draggable card component
const DraggableCard = ({ 
  item, 
  index, 
  moveCard,
  groupId,
  transferItem,
  isSingleItemGroup = false,
  renderItem
}: DraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const lastMoveRef = useRef<{ dragId: string; targetGroupId: string } | null>(null)
  const lastHoverIndexRef = useRef<number | null>(null)
  const lastHoverTimeRef = useRef<number>(0)

  // Throttled move function to prevent rapid updates
  const throttledMoveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    const now = Date.now()
    const throttleDelay = 100 // 100ms throttle
    
    // Check if we should throttle this move
    if (now - lastHoverTimeRef.current < throttleDelay) {
      return
    }
    
    // Check if the hover index has actually changed
    if (lastHoverIndexRef.current === hoverIndex) {
      return
    }
    
    lastHoverTimeRef.current = now
    lastHoverIndexRef.current = hoverIndex
    moveCard(dragIndex, hoverIndex)
  }, [moveCard])

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: item,
    end: () => {
      // Reset refs when drag ends
      lastHoverIndexRef.current = null
      lastHoverTimeRef.current = 0
    },
    collect: (monitor: DragSourceMonitor) => ({
      canDrag: monitor.canDrag(),
      dropResult: monitor.getDropResult(),
      isDragging: monitor.isDragging(),
      dragItem: monitor.getItem(),
      dragItemType: monitor.getItemType(),
      potentialDropTargets: monitor.getTargetIds(),
      handlerId: monitor.getHandlerId(),
      receiveHandlerId: monitor.receiveHandlerId,
    }),
  })

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem: any, monitor) => {
      if (!ref.current) {
        return
      }
      const dragIndex = draggedItem.index
      const hoverIndex = index
      const sourceGroupId = draggedItem.groupId
      const targetGroupId = groupId

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceGroupId === targetGroupId) {
        return
      }

      // If moving between different groups
      if (sourceGroupId !== targetGroupId) {
        // If this is a single item group and we have transferItem function, handle the transfer
        if (isSingleItemGroup && transferItem) {
          // Check if we've already moved this item to this target group
          if (lastMoveRef.current?.dragId === draggedItem.id && 
              lastMoveRef.current?.targetGroupId === targetGroupId) {
            return
          }
          
          transferItem(draggedItem, targetGroupId)
          lastMoveRef.current = { dragId: draggedItem.id, targetGroupId }
        }
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Use throttled move function
      throttledMoveCard(dragIndex, hoverIndex)
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex
    },
    drop: () => {
      // Reset the last move reference when the drag operation ends
      lastMoveRef.current = null
      lastHoverIndexRef.current = null
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
      className="draggable-card"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        marginBottom: 12,
        border: isOver && isSingleItemGroup ? '3px dashed #007bff' : 'none',
        borderRadius: isOver && isSingleItemGroup ? 12 : 8,
        transition: 'all 0.2s ease',
        boxShadow: isOver && isSingleItemGroup ? '0 4px 12px rgba(0,123,255,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          width: 200,
          height: 80,
          backgroundColor: item.color,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
      >
        {renderItem ? renderItem(item) : item.text}
      </div>
    </div>
  )
}

export default DraggableCard 