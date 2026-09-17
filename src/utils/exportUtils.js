import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper: Resolve relative image URL to absolute
const resolveImageUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
};

// Helper: Load image as base64 (returns data URL or null)
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 120;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 120, 120);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (e) {
          console.error('Canvas error:', e);
          resolve(null);
        }
      };
      img.onerror = () => {
        console.warn('Image load failed:', url);
        resolve(null);
      };
      img.src = url;
    } catch (e) {
      console.error('Image exception:', e);
      resolve(null);
    }
  });
};

// Helper: Get nested value from item (item.key or item.user.key)
const getValue = (item, key) => {
  // Check main item
  if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
    return item[key];
  }
  // Check nested user object
  if (item.user && item.user[key] !== undefined && item.user[key] !== null && item.user[key] !== '') {
    return item.user[key];
  }
  // Special case: fullName from firstName + lastName
  if (key === 'fullName') {
    const fullName = item.fullName;
    if (fullName) return fullName;
    if (item.user?.firstName) {
      return `${item.user.firstName} ${item.user.lastName || ''}`.trim();
    }
    if (item.firstName) {
      return `${item.firstName} ${item.lastName || ''}`.trim();
    }
  }
  return '';
};

// Export as CSV
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  if (!data || data.length === 0) return alert('No data to export');
  const rows = data.map(item => headers.map(h => {
    let value = getValue(item, h.key);
    if (h.key === 'isActive') value = value ? 'Active' : 'Inactive';
    return value;
  }));
  const csvContent = [headers.map(h => h.label).join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

// Export as PDF with Professional Design
export const exportToPDF = async (data, headers, title = 'Export', filename = 'export.pdf') => {
  if (!data || data.length === 0) return alert('No data to export');

  try {
    // Landscape gives us far more horizontal room, so headers/values
    // don't have to wrap onto multiple lines.
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ---------- Header banner ----------
    doc.setFillColor(30, 58, 110);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(255, 196, 0);
    doc.rect(0, 26, pageWidth, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}  •  Total records: ${data.length}`,
      pageWidth / 2,
      21,
      { align: 'center' }
    );

    const columns = headers.map(h => h.label);
    const imageColIndices = headers.map((h, idx) => (h.isImage ? idx : -1)).filter(idx => idx !== -1);
    const imageColIndexSet = new Set(imageColIndices);

    // ---------- Build column width map so headers never wrap awkwardly ----------
    // Base width is proportional to the label length, with sensible min/max,
    // and image columns get a fixed compact width for the thumbnail.
    const columnStyles = {};
    headers.forEach((h, idx) => {
      if (h.isImage) {
        columnStyles[idx] = { cellWidth: 22, halign: 'center' };
      } else {
        const label = h.label || '';
        // Roughly: give ~3.1mm per character of header text, clamp between 22 and 55mm
        const estimated = Math.min(55, Math.max(22, label.length * 3.1 + 12));
        columnStyles[idx] = { cellWidth: h.width || estimated };
      }
    });

    // Prepare body and load images using getValue
    const images = {};
    const body = await Promise.all(data.map(async (item, rowIndex) => {
      const row = await Promise.all(headers.map(async (h, colIndex) => {
        if (h.isImage) {
          const rawUrl = getValue(item, h.key);
          const url = resolveImageUrl(rawUrl);
          if (url) {
            const base64 = await loadImageAsBase64(url);
            if (base64) {
              images[rowIndex] = images[rowIndex] || {};
              images[rowIndex][colIndex] = base64;
            }
          }
          return '';
        }
        let value = getValue(item, h.key);
        if (h.key === 'isActive') value = value ? 'Active' : 'Inactive';
        return typeof value === 'string' ? value : String(value);
      }));
      return row;
    }));

    // ---------- Table ----------
    autoTable(doc, {
      head: [columns],
      body,
      startY: 33,
      styles: {
        fontSize: 9,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        valign: 'middle',
        lineColor: [225, 230, 238],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [30, 58, 110],
        fontSize: 9.5,
        fontStyle: 'bold',
        textColor: [255, 255, 255],
        halign: 'left',
        cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
        minCellHeight: 10,
      },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      rowPageBreak: 'avoid',
      minCellHeight: 24,
      margin: { left: 10, right: 10, top: 33, bottom: 18 },
      tableWidth: 'auto',
      columnStyles,
      didParseCell: (data) => {
        if (data.section === 'body' && imageColIndexSet.has(data.column.index)) {
          data.cell.text = [];
        }
        // vertically center the image column height nicely
        if (imageColIndexSet.has(data.column.index)) {
          data.cell.styles.minCellHeight = 24;
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && imageColIndexSet.has(data.column.index)) {
          const size = 18;
          const x = data.cell.x + (data.cell.width - size) / 2;
          const y = data.cell.y + (data.cell.height - size) / 2;
          const rowIndex = data.row.index;
          const colIndex = data.column.index;
          if (images[rowIndex] && images[rowIndex][colIndex]) {
            try {
              doc.addImage(images[rowIndex][colIndex], 'JPEG', x, y, size, size);
              doc.setDrawColor(210, 217, 230);
              doc.setLineWidth(0.2);
              doc.rect(x, y, size, size);
            } catch (e) {
              doc.setFillColor(240, 240, 240);
              doc.rect(x, y, size, size, 'F');
            }
          } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, size, size, 'F');
            doc.setTextColor(150);
            doc.setFontSize(6.5);
            doc.text('N/A', x + size / 2, y + size / 2 + 1, { align: 'center' });
          }
        }
      },
      didDrawPage: () => {
        // Footer band on every page
        doc.setFillColor(30, 58, 110);
        doc.rect(0, pageHeight - 13, pageWidth, 13, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('© 2026 Local Guider. All rights reserved.', pageWidth / 2, pageHeight - 6, { align: 'center' });
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 6,
          { align: 'right' }
        );
      },
    });

    doc.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('PDF export failed: ' + error.message);
  }
};
