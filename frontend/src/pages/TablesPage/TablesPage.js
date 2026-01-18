import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import TableCard from '../../components/TableCard';
import TableModal from '../../components/TableModal';
import QRCodeModal from '../../components/QRCodeModal';
import axios from 'axios';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import TablePrintTicket from '../../components/TablePrintTicket';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [sortBy, setSortBy] = useState('tableNumber:asc');
  const [loading, setLoading] = useState(true);
  // Fetch tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      let url = '/api/tables';
      const params = [];

      if (filterStatus !== 'ALL') {
        params.push(`status=${filterStatus}`);
      }
      if (filterLocation !== 'ALL') {
        params.push(`location=${encodeURIComponent(filterLocation)}`);
      }
      if (sortBy) {
        params.push(`sortBy=${sortBy}`);
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      setTables(response.data);
      setFilteredTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      alert('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/tables/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterLocation, sortBy]);

  const handleAddTable = () => {
    setEditingTable(null);
    setShowModal(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setShowModal(true);
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    try {
      await axios.delete(`/api/tables/${id}`);
      fetchTables();
      alert('Table deleted successfully!');
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    }
  };

  const handleToggleStatus = async (table) => {
    // If currently INACTIVE -> user wants to Activate (send 'ACTIVE' which backend maps to AVAILABLE)
    // If currently anything else (AVAILABLE/OCCUPIED...) -> user wants to Deactivate (send 'INACTIVE')
    const isActive = table.status !== 'INACTIVE';
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const action = isActive ? 'deactivate' : 'reactivate';

    if (!window.confirm(`Are you sure you want to ${action} table ${table.tableNumber}?${newStatus === 'INACTIVE' ? '\n\nDeactivating will prevent new orders from being placed at this table.' : ''}`))
      return;

    try {
      await axios.patch(`/api/tables/${table.id}/status`, { status: newStatus });
      fetchTables();
      alert(`Table ${action}d successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update table status');
    }
  };

  const handleSaveTable = async (tableData) => {
    try {
      if (editingTable) {
        // Update existing table
        await axios.put(`/api/tables/${editingTable.id}`, tableData);
        alert('Table updated successfully!');
      } else {
        // Create new table
        await axios.post('/api/tables', tableData);
        alert('Table created successfully!');
      }
      setShowModal(false);
      fetchTables();
    } catch (error) {
      console.error('Error saving table:', error);
      alert(error.response?.data?.message || 'Failed to save table');
    }
  };

  // Handle viewing QR code
  const handleViewQR = async (table) => {
    // Fetch latest QR data
    try {
      const response = await axios.get(`/api/tables/${table.id}/qr`);
      setSelectedTableForQR(response.data);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error fetching QR data:', error);
      // If no QR exists, still open modal to allow generation
      setSelectedTableForQR(table);
      setShowQRModal(true);
    }
  };

  // Handle generating/regenerating QR code
  const handleGenerateQR = async (tableId) => {
    try {
      // Refresh the selected table data
      const tableResponse = await axios.get(`/api/tables/${tableId}/qr`);
      setSelectedTableForQR(tableResponse.data);
      fetchTables();
      alert('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Failed to generate QR code');
    }
  };

  // Handle regenerating QR code (invalidates old)
  const handleRegenerateQR = async (tableId) => {
    try {
      await axios.post(`/api/tables/${tableId}/qr/regenerate`);
      // Refresh the selected table data
      const tableResponse = await axios.get(`/api/tables/${tableId}/qr`);
      setSelectedTableForQR(tableResponse.data);
      fetchTables();
      alert('QR Code regenerated successfully! The old QR code is now invalid.');
    } catch (error) {
      console.error('Error regenerating QR:', error);
      alert('Failed to regenerate QR code');
    }
  };

  const stats = {
    total: tables.length,
    active: tables.filter(t => t.status !== 'INACTIVE').length,
    inactive: tables.filter(t => t.status === 'INACTIVE').length,
  };

  // Handle print
  const printRef = useRef();
  const [selectedTableForPrint, setSelectedTableForPrint] = useState(null);

  // Setup hàm in ấn từ thư viện với API mới
  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
  });

  // Hàm xử lý khi bấm nút in trên Card
  const handlePrintTable = (table) => {
    setSelectedTableForPrint(table);
    // Timeout 100ms để state kịp cập nhật dữ liệu vào component ẩn trước khi in
    setTimeout(() => {
      handlePrintTrigger();
    }, 100);
  };

  // Hàm gọi API backend để tải PDF với authentication token
  const handleDownloadPdf = async (table) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tables/${table.id}/qr/download`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Table-${table.tableNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  // Hàm gọi API backend để tải ZIP với authentication token
  const handleDownloadAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tables/qr/download-all', {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-qr-codes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Failed to download ZIP file');
    }
  };

  // Hàm bulk regenerate tất cả QR codes
  const handleBulkRegenerateQR = async () => {
    const activeTablesCount = tables.filter(t => t.status === 'ACTIVE').length;

    if (!window.confirm(
      `⚠️ BULK REGENERATE QR CODES\n\n` +
      `This will regenerate QR codes for ${activeTablesCount} active table(s).\n\n` +
      `All old QR codes will be INVALIDATED and customers with old codes won't be able to access the menu.\n\n` +
      `Are you sure you want to continue?`
    )) return;

    try {
      const response = await axios.post('/api/tables/qr/regenerate-all');
      fetchTables();
      alert(`✅ Successfully regenerated QR codes for ${response.data.regeneratedCount} table(s)!`);
    } catch (error) {
      console.error('Error bulk regenerating QR codes:', error);
      alert('Failed to regenerate QR codes');
    }
  };

  // --- HẾT LOGIC MỚI ---
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">Table Management</h1>
            <p className="page-subtitle">Manage tables and view table status</p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={handleBulkRegenerateQR}
              title="Regenerate all QR Codes"
            >
              🔄 Regenerate All QR
            </button>
            <button
              className="btn-primary"
              onClick={handleDownloadAll}
              title="Download all QR Codes as ZIP"
            >
              📦 Download All QR
            </button>
            <button className="btn-primary"
              onClick={handleAddTable}>
              + Add Table
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e8f8f5', color: '#27ae60' }}>
              &#129689;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tables</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e8f5e9', color: '#4caf50' }}>
              &#9989;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ffebee', color: '#f44336' }}>
              &#10060;
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.inactive}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="table-card">
          <div className="table-header">
            <h3>All Tables</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <select
                className="filter-select"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="ALL">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="tableNumber:asc">Table Number (A-Z)</option>
                <option value="tableNumber:desc">Table Number (Z-A)</option>
                <option value="capacity:asc">Capacity (Low-High)</option>
                <option value="capacity:desc">Capacity (High-Low)</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="createdAt:desc">Newest First</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : filteredTables.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No tables found. Click "Add Table" to create one.
            </div>
          ) : (
            <div className="tables-grid">
              {filteredTables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                  onToggleStatus={handleToggleStatus}
                  onViewQR={handleViewQR}
                  onPrintTable={handlePrintTable}
                  onDownload={handleDownloadPdf}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TableModal
          table={editingTable}
          locations={locations}
          onSave={handleSaveTable}
          onClose={() => setShowModal(false)}
        />
      )}

      {showQRModal && selectedTableForQR && (
        <QRCodeModal
          table={selectedTableForQR}
          qrUrl={selectedTableForQR.qrUrl}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTableForQR(null);
          }}
          onRegenerate={selectedTableForQR.qrToken ? handleRegenerateQR : handleGenerateQR}
        />
      )}
      {/* Component ẩn dùng để render nội dung khi in */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <TablePrintTicket ref={printRef} table={selectedTableForPrint} />
      </div>
    </div>
  );
};

export default TablesPage;
