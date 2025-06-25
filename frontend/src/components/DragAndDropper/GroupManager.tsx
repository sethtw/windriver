import GroupDraggableCard from './GroupDraggableCard'
import DraggableCard from './DraggableCard'
import type { Item } from './DraggableCard'
import type { Group } from '../../hooks/useGroupManager'

interface GroupManagerProps {
  groups: Group[]
  groupItems: Record<string, Item[]>
  moveItemInGroup: (groupId: string, dragIndex: number, hoverIndex: number) => void
  transferItem: (item: Item, targetGroupId: string) => void
  containerStyle?: React.CSSProperties
  renderItem?: (item: Item) => React.ReactNode
}

const GroupManager = ({ 
  groups, 
  groupItems, 
  moveItemInGroup, 
  transferItem,
  containerStyle = {},
  renderItem
}: GroupManagerProps) => {
  // Create a consistent moveCard function for each group
  const createMoveCardForGroup = (groupId: string) => {
    return (dragIndex: number, hoverIndex: number) => {
      moveItemInGroup(groupId, dragIndex, hoverIndex)
    }
  }

  // Render individual item or group based on item count
  const renderGroupOrItem = (group: Group) => {
    const items = groupItems[group.id] || []
    const moveCard = createMoveCardForGroup(group.id)
    
    // If group has only one item, render the item directly
    if (items.length === 1) {
      const item = items[0]
      return (
        <DraggableCard
          key={item.id}
          item={item}
          index={0}
          moveCard={moveCard}
          groupId={group.id}
          transferItem={transferItem}
          isSingleItemGroup={true}
          renderItem={renderItem}
        />
      )
    }
    
    // If group has multiple items or is empty, render the group
    return (
      <GroupDraggableCard
        key={group.id}
        groupId={group.id}
        title={group.title}
        items={items}
        moveCard={moveCard}
        transferItem={transferItem}
        backgroundColor={group.backgroundColor}
        renderItem={renderItem}
      />
    )
  }

  const defaultContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    gap: '20px',
    flexWrap: 'wrap',
    ...containerStyle
  }

  return (
    <div style={defaultContainerStyle}>
      {groups.map(group => renderGroupOrItem(group))}
    </div>
  )
}

export default GroupManager 