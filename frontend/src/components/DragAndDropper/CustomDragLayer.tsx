import { useDragLayer } from 'react-dnd'

// Custom drag layer component
const CustomDragLayer = () => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))

  if (!isDragging || !currentOffset) {
    return null
  }

  const { x, y } = currentOffset

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: x,
        top: y,
        transform: 'rotate(-5deg)',
        opacity: 0.75,
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
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      >
        {item.text}
      </div>
    </div>
  )
}

export default CustomDragLayer 