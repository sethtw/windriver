import React, { useCallback, useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GroupManager from '../DragAndDropper/GroupManager';
import { AudioFile } from '../../types';
import { Item } from '../DragAndDropper/DraggableCard';
import IndividualAudioPlayer from './IndividualAudioPlayer';

interface DraggableAudioPlayerProps {
  activePlayers: AudioFile[];
  onRemovePlayer: (fileName: string) => void;
}

interface Group {
  id: string;
  title: string;
  backgroundColor: string;
}

const DraggableAudioPlayer: React.FC<DraggableAudioPlayerProps> = ({ 
  activePlayers, 
  onRemovePlayer 
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupItems, setGroupItems] = useState<Record<string, Item[]>>({});

  // Convert AudioFiles to Items for drag and drop
  const convertAudioFilesToItems = useCallback((files: AudioFile[]): Record<string, Item[]> => {
    const items: Record<string, Item[]> = {};
    
    files.forEach((file, index) => {
      const groupId = `group-${index}`;
      const item: Item = {
        id: file.name,
        text: file.name,
        color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`, // Generate different colors
        groupId,
        audioFile: file,
        metadata: {
          manifestUrl: file.manifest_url,
          index
        }
      };
      
      items[groupId] = [item];
    });
    
    return items;
  }, []);

  // Create initial groups from active players
  const createInitialGroups = useCallback((files: AudioFile[]): Group[] => {
    return files.map((file, index) => ({
      id: `group-${index}`,
      title: file.name,
      backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 90%)`
    }));
  }, []);

  // Update groups and items when activePlayers change
  useEffect(() => {
    if (activePlayers.length === 0) {
      setGroups([]);
      setGroupItems({});
      return;
    }

    const newGroups = createInitialGroups(activePlayers);
    const newGroupItems = convertAudioFilesToItems(activePlayers);

    setGroups(newGroups);
    setGroupItems(newGroupItems);
  }, [activePlayers, createInitialGroups, convertAudioFilesToItems]);

  // Move item within a group
  const moveItemInGroup = useCallback((groupId: string, dragIndex: number, hoverIndex: number) => {
    setGroupItems(prev => {
      const newGroupItems = { ...prev };
      const items = [...newGroupItems[groupId]];
      const draggedItem = items[dragIndex];
      
      if (!draggedItem) return prev;
      
      items.splice(dragIndex, 1);
      items.splice(hoverIndex, 0, draggedItem);
      
      newGroupItems[groupId] = items;
      return newGroupItems;
    });
  }, []);

  // Transfer item between groups
  const transferItem = useCallback((item: Item, targetGroupId: string) => {
    setGroupItems(prev => {
      const newGroupItems = { ...prev };
      const sourceGroupId = item.groupId;
      
      // Add to target group with updated groupId
      const updatedItem = { ...item, groupId: targetGroupId };
      newGroupItems[targetGroupId] = [...(newGroupItems[targetGroupId] || []), updatedItem];
      
      // Remove from source group
      if (newGroupItems[sourceGroupId]) {
        newGroupItems[sourceGroupId] = newGroupItems[sourceGroupId].filter(i => i.id !== item.id);
      }
      
      return newGroupItems;
    });
  }, []);

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
          {item.text}
        </div>
      );
    }

    return (
      <Box sx={{ width: 300, minHeight: 200 }}>
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
          transferItem={transferItem}
          renderItem={renderAudioItem}
          containerStyle={{
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '16px'
          }}
        />
      </Box>
    </DndProvider>
  );
};

export default DraggableAudioPlayer; 