import GroupDraggableCard from './GroupDraggableCard'
import type { Item } from './DraggableCard'
import type { Group } from '../../hooks/useGroupManager'

interface GroupManagerProps {
  groups: Group[]
  groupItems: Record<string, Item[]>
  moveItemInGroup: (groupId: string, id: string, atIndex: number) => void
  findCard: (groupId: string, id: string) => { card: Item; index: number }
  transferItem: (item: Item, targetGroupId: string) => void
  containerStyle?: React.CSSProperties
  renderItem?: (item: Item) => React.ReactNode
}

const GroupManager = ({ 
  groups, 
  groupItems, 
  moveItemInGroup, 
  findCard,
  transferItem,
  containerStyle = {},
  renderItem
}: GroupManagerProps) => {
  // Create a consistent moveCard function for each group
  const createMoveCardForGroup = (groupId: string) => {
    return (id: string, atIndex: number) => {
      moveItemInGroup(groupId, id, atIndex)
    }
  }

  // Create a consistent findCard function for each group
  const createFindCardForGroup = (groupId: string) => {
    return (id: string) => {
      return findCard(groupId, id)
    }
  }

  // Render group
  const renderGroup = (group: Group) => {
    const items = groupItems[group.id] || []
    const moveCard = createMoveCardForGroup(group.id)
    const findCardForGroup = createFindCardForGroup(group.id)
    
    return (
      <GroupDraggableCard
        key={group.id}
        groupId={group.id}
        title={group.title}
        items={items}
        moveCard={moveCard}
        findCard={findCardForGroup}
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
    justifyContent: 'left',
    width: '100%',
    gap: '20px',
    flexWrap: 'wrap',
    overflowY: 'auto',
    maxHeight: '700px',
    ...containerStyle
  }

  return (
    <div style={defaultContainerStyle}>
      {groups.map(renderGroup)}
    </div>
  )
}

export default GroupManager 