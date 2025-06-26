import React, { useCallback, useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GroupManager from '../DragAndDropper/GroupManager';
import { AudioFile } from '../../types';
import { Item } from '../DragAndDropper/DraggableCard';
import { useGroupManager, type Group } from '../../hooks/useGroupManager';
import { generateColor } from '../../utils/dragAndDropUtils';
import IndividualAudioPlayer from './IndividualAudioPlayer';

interface DraggableAudioPlayerProps {
  activePlayers: AudioFile[];
  onRemovePlayer: (fileName: string) => void;
}

const DraggableAudioPlayer: React.FC<DraggableAudioPlayerProps> = ({ 
  activePlayers, 
  onRemovePlayer 
}) => {
  // Convert AudioFiles to initial groups and items
  const { initialGroups, initialGroupItems } = useMemo(() => {
    if (activePlayers.length === 0) {
      return { initialGroups: [], initialGroupItems: {} };
    }

    const groups: Group[] = activePlayers.map((file, index) => ({
      id: `group-${index}`,
      title: file.name,
      backgroundColor: generateColor(index, 70, 90)
    }));

    const groupItems: Record<string, Item[]> = {};
    activePlayers.forEach((file, index) => {
      const groupId = `group-${index}`;
      const item: Item = {
        id: file.name,
        text: file.name,
        color: generateColor(index, 70, 60),
        groupId,
        audioFile: file,
        metadata: {
          manifestUrl: file.manifest_url,
          index
        }
      };
      groupItems[groupId] = [item];
    });

    console.log('DraggableAudioPlayer: Updated activePlayers', {
      activePlayersCount: activePlayers.length,
      groupsCount: groups.length,
      groupItemsKeys: Object.keys(groupItems)
    });

    return { initialGroups: groups, initialGroupItems: groupItems };
  }, [activePlayers]);

  const {
    groups,
    groupItems,
    moveItemInGroup,
    findCard,
    transferItem,
  } = useGroupManager({ initialGroups, initialGroupItems });

  console.log('DraggableAudioPlayer: Current state', {
    groupsCount: groups.length,
    groupItemsCount: Object.keys(groupItems).length
  });

  // Custom render function for audio items
  const renderAudioItem = useCallback((item: Item) => {
    if (!item.audioFile) {
      return (
        <div
          style={{
            width: 200,
            height: 80,
            backgroundColor: item.color,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'left',
            justifyContent: 'left',
            color: 'grey',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          {item.text}
        </div>
      );
    }

    return (
      <Box sx={{ minWidth: 400, minHeight: 200 }}>
        <IndividualAudioPlayer
          file={item.audioFile}
          onRemove={onRemovePlayer}
        />
      </Box>
    );
  }, [onRemovePlayer]);

  if (activePlayers.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No active players
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select files from the list to create audio players
        </Typography>
      </Paper>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box>
        <Typography variant="h5" gutterBottom>
          Active Players ({activePlayers.length})
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Drag and drop players to organize them into groups
          </Typography>
        </Box>
        <GroupManager
          groups={groups}
          groupItems={groupItems}
          moveItemInGroup={moveItemInGroup}
          findCard={findCard}
          transferItem={transferItem}
          renderItem={renderAudioItem}
          containerStyle={{
            padding: '16px',
            alignItems: 'left'
          }}
        />
      </Box>
    </DndProvider>
  );
};

export default DraggableAudioPlayer; 