// src/components/TablePrintTicket.js
import React from 'react';
import QRCode from 'react-qr-code';

const TablePrintTicket = React.forwardRef(({ table }, ref) => {
  if (!table) return null;

  // URL trỏ về trang gọi món của khách
  const qrUrl = `http://localhost:3000/menu?table=${table.id}&token=${table.qrToken || ''}`;

  return (
    <div ref={ref} style={{ 
      width: '300px', 
      height: '400px', 
      padding: '20px', 
      textAlign: 'center', 
      border: '1px dashed #ccc', // Viền đứt nét để dễ hình dung khổ giấy
      backgroundColor: 'white',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
        Bàn {table.tableNumber}
      </h2>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
        Smart Restaurant
      </p>
      
      <div style={{ border: '4px solid #000', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
        <QRCode value={qrUrl} size={160} />
      </div>

      <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>Quét để gọi món</p>
      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Wifi: Smart_Guest</p>
    </div>
  );
});

export default TablePrintTicket;
