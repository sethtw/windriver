import { useRef, useCallback } from 'react'

// Common throttling hook for drag operations
export const useThrottledOperation = (delay: number = 100) => {
  const lastOperationTimeRef = useRef<number>(0)
  const lastOperationRef = useRef<string | null>(null)

  const throttledOperation = useCallback((operation: () => void, operationKey: string) => {
    const now = Date.now()
    
    // Check if we should throttle this operation
    if (now - lastOperationTimeRef.current < delay) {
      return
    }
    
    // Check if we've already performed this exact operation
    if (lastOperationRef.current === operationKey) {
      return
    }
    
    lastOperationTimeRef.current = now
    lastOperationRef.current = operationKey
    operation()
  }, [delay])

  const resetThrottle = useCallback(() => {
    lastOperationTimeRef.current = 0
    lastOperationRef.current = null
  }, [])

  return { throttledOperation, resetThrottle }
}

// Simplified collect function for useDrop
export const createSimpleDropCollect = () => ({
  isOver: (monitor: any) => monitor.isOver(),
  canDrop: (monitor: any) => monitor.canDrop(),
})

// Color generation utility
export const generateColor = (index: number, saturation: number = 70, lightness: number = 60) => {
  return `hsl(${(index * 137.5) % 360}, ${saturation}%, ${lightness}%)`
}

// Common drag item interface
export interface DragItem {
  id: string
  originalIndex: number
  groupId: string
  text: string
  color: string
  audioFile?: any
  metadata?: Record<string, any>
} 