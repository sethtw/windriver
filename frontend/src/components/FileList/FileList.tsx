import React from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Paper,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AudioFile } from '../../types';

interface FileListProps {
  files: AudioFile[];
  selectedFile: AudioFile | null;
  onFileSelect: (file: AudioFile) => void;
  onFileDelete: (file: AudioFile) => Promise<void>;
}

const FileList: React.FC<FileListProps> = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFileDelete 
}) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="h6" gutterBottom>
      Available Files
    </Typography>
    <List>
      {files.map((file) => (
        <ListItem
          key={file.name}
          button
          selected={selectedFile?.name === file.name}
          onClick={() => onFileSelect(file)}
          secondaryAction={
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
          }
        >
          <ListItemText primary={file.name} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default FileList; 