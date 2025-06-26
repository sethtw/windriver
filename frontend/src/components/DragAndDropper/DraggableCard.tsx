import { useRef, useCallback } from 'react'
import { type DragSourceMonitor, type DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import { useThrottledOperation, createSimpleDropCollect, type DragItem } from '../../utils/dragAndDropUtils'
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
  moveCard: (id: string, atIndex: number) => void
  findCard: (id: string) => { card: Item; index: number }
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
  findCard,
  groupId,
  transferItem,
  isSingleItemGroup = false,
  renderItem
}: DraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { throttledOperation, resetThrottle } = useThrottledOperation()

  // Throttled move function
  const throttledMoveCard = useCallback((id: string, atIndex: number) => {
    throttledOperation(() => moveCard(id, atIndex), `move-${id}-${atIndex}`)
  }, [moveCard, throttledOperation])

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.CARD,
      item: { 
        id: item.id, 
        originalIndex: index, 
        groupId: item.groupId, 
        text: item.text, 
        color: item.color,
        audioFile: item.audioFile,
        metadata: item.metadata
      } as DragItem,
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging()
      }),
      end: (item: any, monitor) => {
        const { id: droppedId, originalIndex } = item
        const didDrop = monitor.didDrop()
        if (!didDrop) {
          moveCard(droppedId, originalIndex)
        }
        resetThrottle()
      },
    }),
    [item.id, index, moveCard, resetThrottle],
  )

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      hover: (draggedItem: DragItem, monitor) => {
        if (!ref.current) return
        
        const dragIndex = draggedItem.originalIndex
        const hoverIndex = index
        const sourceGroupId = draggedItem.groupId
        const targetGroupId = groupId

        // Don't replace items with themselves
        if (dragIndex === hoverIndex && sourceGroupId === targetGroupId) return

        // If moving between different groups
        if (sourceGroupId !== targetGroupId) {
          if (isSingleItemGroup && transferItem) {
            throttledOperation(
              () => transferItem(draggedItem, targetGroupId),
              `transfer-${draggedItem.id}-${targetGroupId}`
            )
          }
          return
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect()
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
        const clientOffset = monitor.getClientOffset()
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top

        // Only perform the move when the mouse has crossed half of the items height
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

        // Use throttled move function
        throttledMoveCard(draggedItem.id, hoverIndex)
        draggedItem.originalIndex = hoverIndex
      },
      drop: () => {
        resetThrottle()
        return { dropped: true }
      },
      collect: (monitor: DropTargetMonitor) => createSimpleDropCollect().isOver(monitor),
    }),
    [findCard, moveCard, index, groupId, transferItem, isSingleItemGroup, throttledMoveCard, resetThrottle],
  )

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