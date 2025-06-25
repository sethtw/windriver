import { useState, useCallback, useEffect } from 'react'
import type { Item } from '../components/DragAndDropper'

interface Group {
  id: string
  title: string
  backgroundColor: string
}

interface UseGroupManagerProps {
  initialGroups: Group[]
  initialGroupItems: Record<string, Item[]>
}

export const useGroupManager = ({ initialGroups, initialGroupItems }: UseGroupManagerProps) => {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [groupItems, setGroupItems] = useState<Record<string, Item[]>>(initialGroupItems)

  // Generate unique IDs
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Clean up empty groups whenever groupItems changes
  useEffect(() => {
    const emptyGroupIds = Object.keys(groupItems).filter(
      groupId => groupItems[groupId].length === 0
    )
    
    if (emptyGroupIds.length > 0) {
      setGroups(prevGroups => prevGroups.filter(group => !emptyGroupIds.includes(group.id)))
    }
  }, [groupItems])

  // Create a new group
  const createGroup = () => {
    const newGroup: Group = {
      id: generateId(),
      title: `Group ${groups.length + 1}`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 90%)`,
    }
    setGroups(prev => [...prev, newGroup])
    setGroupItems(prev => ({ ...prev, [newGroup.id]: [] }))
  }

  // Create a new item in its own group
  const createNewItem = () => {
    const newGroup: Group = {
      id: generateId(),
      title: `Item ${groups.length + 1}`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 90%)`,
    }
    
    const newItem: Item = {
      id: generateId(),
      text: `Item ${groups.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      groupId: newGroup.id,
    }
    
    setGroups(prev => [...prev, newGroup])
    setGroupItems(prev => ({ ...prev, [newGroup.id]: [newItem] }))
  }

  // Create a new item in an existing group
  const createItemInGroup = (groupId: string) => {
    const newItem: Item = {
      id: generateId(),
      text: `Item ${Object.values(groupItems).flat().length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      groupId: groupId,
    }
    
    setGroupItems(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), newItem]
    }))
  }

  // Move item within a group
  const moveItemInGroup = useCallback((groupId: string, dragIndex: number, hoverIndex: number) => {
    setGroupItems(prev => {
      const newGroupItems = { ...prev }
      const items = [...newGroupItems[groupId]]
      const draggedItem = items[dragIndex]
      
      if (!draggedItem) return prev
      
      items.splice(dragIndex, 1)
      items.splice(hoverIndex, 0, draggedItem)
      
      newGroupItems[groupId] = items
      return newGroupItems
    })
  }, [])

  // Transfer item between groups
  const transferItem = useCallback((item: Item, targetGroupId: string) => {
    setGroupItems(prev => {
      const newGroupItems = { ...prev }
      const sourceGroupId = item.groupId
      
      // Add to target group with updated groupId
      const updatedItem = { ...item, groupId: targetGroupId }
      newGroupItems[targetGroupId] = [...(newGroupItems[targetGroupId] || []), updatedItem]
      
      // Remove from source group
      if (newGroupItems[sourceGroupId]) {
        newGroupItems[sourceGroupId] = newGroupItems[sourceGroupId].filter(i => i.id !== item.id)
      }
      
      return newGroupItems
    })
  }, [])

  // Create a new single-item group from an existing item
  const createSingleItemGroup = useCallback((item: Item) => {
    // Create a new group for this item
    const newGroup: Group = {
      id: generateId(),
      title: item.text,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 90%)`,
    }
    
    setGroupItems(prev => {
      const newGroupItems = { ...prev }
      const sourceGroupId = item.groupId
      
      // Remove the item from its source group only
      if (newGroupItems[sourceGroupId]) {
        newGroupItems[sourceGroupId] = newGroupItems[sourceGroupId].filter(i => i.id !== item.id)
      }
      
      // Add the new group and place the item in it with updated groupId
      const updatedItem = { ...item, groupId: newGroup.id }
      newGroupItems[newGroup.id] = [updatedItem]
      
      return newGroupItems
    })
    
    // Add the new group
    setGroups(prev => [...prev, newGroup])
  }, [])

  // Handle item drop in drop zone - creates a single-item group
  const handleItemDrop = useCallback((item: Item) => {
    createSingleItemGroup(item)
  }, [createSingleItemGroup])

  return {
    groups,
    groupItems,
    createGroup,
    createNewItem,
    createItemInGroup,
    moveItemInGroup,
    transferItem,
    handleItemDrop,
  }
}

export type { Group } 