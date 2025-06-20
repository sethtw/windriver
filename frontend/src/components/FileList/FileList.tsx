import React from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Paper,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { AudioFile } from '../../types';

interface FileListProps {
  files: AudioFile[];
  selectedFile: AudioFile | null;
  activePlayers?: AudioFile[];
  onFileSelect: (file: AudioFile) => void;
  onFileDelete: (file: AudioFile) => Promise<void>;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  selectedFile, 
  activePlayers = [],
  onFileSelect, 
  onFileDelete 
}) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="h6" gutterBottom>
      Available Files ({files.length})
    </Typography>
    <List>
      {files.map((file) => {
        const isActive = activePlayers.some(player => player.name === file.name);
        return (
          <ListItem
            key={file.name}
            button
            selected={selectedFile?.name === file.name}
            onClick={() => onFileSelect(file)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isActive && (
                  <Chip 
                    label="Active" 
                    size="small" 
                    color="success" 
                    icon={<PlayArrowIcon />}
                  />
                )}
                <IconButton
                  edge="end"
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(file);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText 
              primary={file.name}
              secondary={isActive ? 'Currently playing' : 'Click to add player'}
            />
          </ListItem>
        );
      })}
    </List>
  </Paper>
);

export default FileList; 