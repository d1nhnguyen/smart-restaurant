import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import Sidebar from '../../components/Sidebar';
import './ReportsPage.css';

const ReportsPage = () => {
    const [dateFilter, setDateFilter] = useState('7days'); // 7days, 30days, month, lastmonth
    const [loading, setLoading] = useState(true);
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Reports-${new Date().toISOString().split('T')[0]}`,
        onBeforeGetContent: () => { },
        onAfterPrint: () => { },
        onPrintError: (error) => { },
    });

    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        avgPrepTime: 0
    });

    const [revenueData, setRevenueData] = useState([]);
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [topItems, setTopItems] = useState([]);

    // Calculate Date Ranges
    const getDateRange = useCallback(() => {
        const end = new Date();
        const start = new Date();

        switch (dateFilter) {
            // ... (rest of switch case)
            case '30days':
                start.setDate(end.getDate() - 30);
                break;
            case 'month':
                start.setDate(1); // 1st of current month
                break;
            case 'lastmonth':
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); // Last day of previous month
                break;
            case '7days':
            default:
                start.setDate(end.getDate() - 7);
                break;
        }
        return { start, end };
    }, [dateFilter]);


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const params = {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                timeZone
            };

            const token = localStorage.getItem('token');
            const config = {
                params,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            };

            // Fetch all data in parallel
            const [summaryRes, revenueRes, peakHoursRes, topItemsRes] = await Promise.all([
                axios.get('/api/analytics/summary', config),
                // Remove period override, keeping single source of truth for params
                axios.get('/api/analytics/revenue-chart', config),
                axios.get('/api/analytics/peak-hours', config),
                axios.get('/api/analytics/top-items', config)
            ]);

            setSummary(summaryRes.data);
            setRevenueData(revenueRes.data);
            setPeakHoursData(peakHoursRes.data);
            setTopItems(topItemsRes.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            // alert('Failed to load reports data'); // Optional: show error toast
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ... (rest of chart renderers)

    // SVG Chart Generators 
    // Simple Line Chart for Revenue
    const renderRevenueChart = () => {
        if (!revenueData || revenueData.length === 0) return <div>No data available</div>;

        const height = 200;
        const width = 600;
        const padding = 40;

        // Find Max Value for scaling
        const maxRev = Math.max(...revenueData.map(d => d.revenue), 100); // min 100 to avoid div by zero

        const xScale = (index) => padding + (index * (width - 2 * padding) / (revenueData.length - 1 || 1));
        const yScale = (value) => height - padding - ((value / maxRev) * (height - 2 * padding));

        const points = revenueData.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(' ');

        // Area Path
        const areaPath = `
      M${padding},${height - padding} 
      L${points} 
      L${xScale(revenueData.length - 1)},${height - padding} 
      Z
    `;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#e74c3c', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#e74c3c', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* Grid Lines (simplified) */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const y = height - padding - (ratio * (height - 2 * padding));
                    return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#dfe6e9" strokeWidth="1" />;
                })}

                {/* Axis Labels (Y) */}
                {[0, 0.5, 1].map(ratio => {
                    const val = Math.round(ratio * maxRev);
                    const y = height - padding - (ratio * (height - 2 * padding));
                    return <text key={ratio} x={padding - 10} y={y + 5} fill="#7f8c8d" fontSize="10" textAnchor="end">${val}</text>;
                })}

                {/* Area */}
                <path d={areaPath} fill="url(#gradient)" />
                {/* Line */}
                <path d={`M${points}`} fill="none" stroke="#e74c3c" strokeWidth="3" />

                {/* Points */}
                {revenueData.map((d, i) => (
                    <circle key={i} cx={xScale(i)} cy={yScale(d.revenue)} r="4" fill="#e74c3c">
                        <title>{new Date(d.date).toLocaleDateString()}: ${d.revenue}</title>
                    </circle>
                ))}

                {/* X Axis Labels (First and Last only) */}
                <text x={padding} y={height - 15} fill="#7f8c8d" fontSize="10" textAnchor="middle">{new Date(revenueData[0]?.date).toLocaleDateString()}</text>
                <text x={width - padding} y={height - 15} fill="#7f8c8d" fontSize="10" textAnchor="middle">{new Date(revenueData[revenueData.length - 1]?.date).toLocaleDateString()}</text>
            </svg>
        );
    };

    return (
        <div className="admin-layout reports-page">
            <Sidebar />
            <div className="admin-content" ref={componentRef}>
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Reports & Analytics</h1>
                        <p className="page-subtitle">Track your restaurant's performance</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            className="btn-primary"
                            onClick={handlePrint}
                            disabled={loading}
                            style={{ marginRight: '10px', backgroundColor: loading ? '#95a5a6' : '#34495e' }}
                        >
                            &#128196; Export PDF
                        </button>
                        <select
                            className="filter-select"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="month">This Month</option>
                            <option value="lastmonth">Last Month</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                ) : (
                    <div ref={componentRef} className="printable-report">
                        {/* Summary Stats */}

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#e8f8f5', color: '#27ae60' }}>&#128176;</div>
                                <div className="stat-content">
                                    <div className="stat-value">${summary.totalRevenue.toLocaleString()}</div>
                                    <div className="stat-label">Total Revenue</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#ebf5fb', color: '#3498db' }}>&#128230;</div>
                                <div className="stat-content">
                                    <div className="stat-value">{summary.totalOrders}</div>
                                    <div className="stat-label">Total Orders</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fef9e7', color: '#f39c12' }}>&#127860;</div>
                                <div className="stat-content">
                                    <div className="stat-value">${summary.avgOrderValue.toFixed(2)}</div>
                                    <div className="stat-label">Avg. Order Value</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fdedec', color: '#e74c3c' }}>&#128337;</div>
                                <div className="stat-content">
                                    <div className="stat-value">{summary.avgPrepTime} min</div>
                                    <div className="stat-label">Avg. Prep Time</div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            {/* Revenue Chart */}
                            <div className="chart-card" style={{ flex: '1 1 600px' }}>
                                <div className="chart-header">
                                    <h3>Revenue Over Time</h3>
                                </div>
                                <div className="chart-placeholder" style={{ height: '300px' }}>
                                    {renderRevenueChart()}
                                </div>
                            </div>

                            {/* Peak Hours */}
                            <div className="chart-card" style={{ flex: '1 1 300px' }}>
                                <div className="chart-header">
                                    <h3>Peak Hours (Orders)</h3>
                                </div>
                                <div className="peak-hours">
                                    {peakHoursData.filter(h => h.count > 0).length === 0 ? (
                                        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>No orders yet</div>
                                    ) : (
                                        peakHoursData
                                            .filter(h => h.hour >= 8 && h.hour <= 22)
                                            .map(h => {
                                                const maxCount = Math.max(...peakHoursData.map(d => d.count), 1);
                                                const percent = (h.count / maxCount) * 100;
                                                return (
                                                    <div key={h.hour} className="hour-bar">
                                                        <span className="hour-label">{h.hour}:00</span>
                                                        <div className="hour-track">
                                                            <div
                                                                className={`hour-progress ${percent > 80 ? 'peak' : ''}`}
                                                                style={{ width: `${percent}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="hour-value">{h.count}</span>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Items Table */}
                        <div className="table-card">
                            <div className="table-header">
                                <h3>Top Selling Items</h3>
                            </div>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Item</th>
                                        <th>Orders</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topItems.length === 0 ? (
                                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No items sold in this period</td></tr>
                                    ) : (
                                        topItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <span className={`rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td>{item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ReportsPage;
