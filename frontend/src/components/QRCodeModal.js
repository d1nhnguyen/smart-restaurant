import React, { useState } from 'react';
import QRCode from 'react-qr-code';

const QRCodeModal = ({ table, qrUrl, onClose, onRegenerate }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate(table.id);
      setShowConfirm(false);
    } catch (error) {
      console.error('Error regenerating QR:', error);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>QR Code - {table.tableNumber}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-preview-section">
            {qrUrl ? (
              <div className="qr-code-container">
                <QRCode
                  value={qrUrl}
                  size={200}
                  level="H"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
                <div className="qr-table-label">{table.tableNumber}</div>
              </div>
            ) : (
              <div className="qr-not-generated">
                <p>QR Code not generated yet</p>
                <button
                  className="btn-primary"
                  onClick={() => onRegenerate(table.id)}
                >
                  Generate QR Code
                </button>
              </div>
            )}
          </div>

          <div className="qr-details-section">
            <h4>Table Information</h4>
            <div className="detail-row">
              <span className="detail-label">Table Name:</span>
              <span className="detail-value">{table.tableNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Capacity:</span>
              <span className="detail-value">{table.capacity} seats</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{table.location || 'Not specified'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${table.status.toLowerCase()}`}>
                {table.status === 'ACTIVE' ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
            {qrUrl && (
              <div className="detail-row">
                <span className="detail-label">QR URL:</span>
                <a 
                  href={qrUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="detail-value url-value" 
                  title={qrUrl}
                  style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {qrUrl.length > 40 ? qrUrl.substring(0, 40) + '...' : qrUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="qr-modal-actions">
          {qrUrl && (
            <>
              {!showConfirm ? (
                <button
                  className="btn-warning"
                  onClick={() => setShowConfirm(true)}
                >
                  🔄 Regenerate QR
                </button>
              ) : (
                <div className="confirm-regenerate">
                  <p className="warning-text">
                    ⚠️ Warning: Regenerating will invalidate the old QR code.
                    Customers with the old QR code won't be able to access the menu.
                  </p>
                  <div className="confirm-buttons">
                    <button
                      className="btn-danger"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                    >
                      {regenerating ? 'Regenerating...' : 'Yes, Regenerate'}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
