import React from 'react';
import { Button, CircularProgress } from '@mui/material';

interface FileUploaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, loading }) => (
  <label htmlFor="file-upload">
    <input
      accept="audio/*"
      style={{ display: 'none' }}
      id="file-upload"
      type="file"
      onChange={onFileUpload}
    />
    <Button
      variant="contained"
      component="span"
      disabled={loading}
    >
      {loading ? <CircularProgress size={16} /> : 'Upload Audio'}
    </Button>
  </label>
);

export default FileUploader; 