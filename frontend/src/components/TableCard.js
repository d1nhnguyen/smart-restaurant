import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Thêm prop onRegenerateQR, onDownload, onPrintTable vào danh sách props nhận vào
const TableCard = ({ table, onEdit, onDelete, onToggleStatus, onDownload, onViewQR, onPrintTable }) => {
  // Backend uses 'AVAILABLE', 'OCCUPIED', etc. Only 'INACTIVE' is truly inactive.
  const isActive = table.status !== 'INACTIVE';

  return (
    <div className={`table-tile ${isActive ? 'available' : 'inactive'}`}>
      <div className="table-number">{table.tableNumber}</div>
      <div className={`table-status ${isActive ? 'available' : 'inactive'}`}>
        {isActive ? '✅ Active' : '❌ Inactive'}
      </div>

      <div className="table-info">
        <span>{table.capacity} seats</span>
        <span>{table.location || 'No location'}</span>
      </div>
      {table.description && (
        <div className="table-description">{table.description}</div>
      )}

      {table.qrToken && (
        <div className="table-qr-preview" onClick={() => onViewQR(table)} style={{ cursor: 'pointer', padding: '10px 0', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'white', padding: '8px', borderRadius: '4px' }}>
            <QRCodeSVG
              value={`http://localhost:3001/menu?table=${table.id}&token=${table.qrToken}`}
              size={80}
              level="H"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      )}

      <div className="table-actions">

        <button
          className="btn-small btn-edit"
          title="Edit"
          onClick={() => onEdit(table)}
        >
          &#9998;
        </button>
        <button
          className="btn-small btn-toggle"
          title={isActive ? 'Deactivate' : 'Activate'}
          onClick={() => onToggleStatus(table)}
        >
          {isActive ? '🔒' : '🔓'}
        </button>
        <button
          className="btn-small btn-delete"
          title="Delete"
          onClick={() => onDelete(table.id)}
        >
          &#128465;
        </button>

        <button
          className="btn-small"
          title="Download PDF"
          onClick={() => onDownload(table)}
        >
          ⬇️
        </button>

        <button
          className="btn-small"
          title="Print Table QR"
          onClick={() => onPrintTable(table)}
        >
          🖨️
        </button>
      </div>
    </div>
  );
};

export default TableCard;