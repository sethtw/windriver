import { useRef } from 'react'
import { useDrop } from 'react-dnd'
import { ItemTypes } from './DraggableCard'
import type { Item } from './DraggableCard'
import CustomDragLayer from './CustomDragLayer'

interface DropZoneProps {
  onItemDrop: (item: Item) => void
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hoverMessage?: string
  showHoverMessage?: boolean
}

const DropZone = ({ 
  onItemDrop, 
  children, 
  className = "drop-zone",
  style = {},
  hoverMessage = "",
  showHoverMessage = true
}: DropZoneProps) => {
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Drop zone for creating single-item groups
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (draggedItem: any, monitor) => {
      // Only handle the drop if no nested target handled it
      if (!monitor.didDrop()) {
        // Call the provided callback with the dragged item
        onItemDrop(draggedItem)
        return { dropped: true }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  })

  // Combine the refs
  drop(dropZoneRef)

  const defaultStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '600px',
    padding: '30px',
    backgroundColor: isOver ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    border: isOver ? '3px dashed #007bff' : '2px dashed #dee2e6',
    backdropFilter: 'blur(10px)',
    boxShadow: isOver ? '0 8px 32px rgba(0,123,255,0.2)' : '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    position: 'relative',
    ...style
  }

  return (
    <>
    <div 
      ref={dropZoneRef}
      className={className}
      style={defaultStyle}
    >
      {isOver && showHoverMessage && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#007bff',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          {hoverMessage}
        </div>
      )}
      {children}
    </div>
    <CustomDragLayer />
    </>
  )
}

export default DropZone 