import { useState } from 'react';
import { Button, ButtonGroup, CircularProgress, Alert } from '@mui/material';
import { FileDownload, PictureAsPdf } from '@mui/icons-material';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const ExportButtons = ({ data, headers, filename = 'export' }) => {
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError] = useState(null);

  const handleCSV = () => {
    if (!data || data.length === 0) return setError('No data to export');
    setLoadingType('csv');
    setTimeout(() => {
      try {
        exportToCSV(data, headers, `${filename}.csv`);
        setError(null);
      } catch (err) {
        setError('CSV export failed');
      }
      setLoadingType(null);
    }, 100);
  };

  const handlePDF = async () => {
    if (!data || data.length === 0) return setError('No data to export');
    setLoadingType('pdf');
    try {
      await exportToPDF(data, headers, filename, `${filename}.pdf`);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('PDF export failed');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <ButtonGroup size="small" variant="outlined" sx={{ ml: 2 }}>
        <Button onClick={handleCSV} startIcon={loadingType === 'csv' ? <CircularProgress size={14} /> : <FileDownload />}>
          CSV
        </Button>
        <Button onClick={handlePDF} startIcon={loadingType === 'pdf' ? <CircularProgress size={14} /> : <PictureAsPdf />}>
          PDF
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default ExportButtons;