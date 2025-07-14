// components/ForecastWizard/FileUpload.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function FileUpload({ data, onUpdate, onNext, setError, setLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 Base URL:', window.location.origin);
    console.log('📡 API URL:', '/api/wizard/upload');
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    console.log('📁 Uploading file:', file.name, 'Size:', file.size);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Check if file is actually readable
    try {
      const testRead = await file.text();
      if (!testRead.trim()) {
        setError('File appears to be empty');
        return;
      }
    } catch (err) {
      setError('Unable to read file: ' + err.message);
      return;
    }

    const uploadWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          console.log(`📤 Upload attempt ${i + 1}/${retries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch('/api/wizard/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
          }

          return result;

        } catch (error) {
          console.error(`💥 Upload attempt ${i + 1} failed:`, error);
          
          if (i === retries - 1) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    setUploading(true);
    setError('');

    try {
      const result = await uploadWithRetry();
      
      onUpdate({
        file: file,
        previewData: result.preview,
        columns: result.columns,
        totalRows: result.totalRows
      });

      setError('');
    } catch (error) {
      console.error('💥 Final upload error:', error);
      
      if (error.name === 'AbortError') {
        setError('Upload timeout - please try again');
      } else {
        setError(`Upload failed: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Step 1: Upload Your CSV File
      </Typography>
      
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: dragOver ? '#f5f5f5' : 'transparent',
          cursor: 'pointer',
          mb: 3,
          '&:hover': { bgcolor: '#f9f9f9' }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        
        <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
        
        {uploading ? (
          <Box>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography>Uploading and processing file...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Drop your CSV file here or click to browse
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported format: CSV files only
            </Typography>
          </Box>
        )}
      </Box>

      {data.file && (
        <Alert severity="success" sx={{ mb: 3 }}>
          File uploaded successfully: {data.file.name} ({data.totalRows} rows)
        </Alert>
      )}

      {data.previewData && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Data Preview (First 10 rows)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {data.columns.map((column) => (
                    <TableCell key={column} sx={{ fontWeight: 600 }}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.previewData.map((row, index) => (
                  <TableRow key={index}>
                    {data.columns.map((column) => (
                      <TableCell key={column}>
                        {row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!data.file || uploading}
        >
          Next: Select Columns
        </Button>
      </Box>
    </Box>
  );
}