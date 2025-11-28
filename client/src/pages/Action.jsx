import React, { useEffect, useState } from "react";
import {FaSort, FaSortUp, FaSortDown, FaSearch, FaArrowLeft, FaArrowRight, FaFilter,} from "react-icons/fa";
import "../styles/DataSensor.css";

import { token } from "./config.jsx";

const API_ACTIONS = "http://127.0.0.1:8000/api/actions/";
const API_DEVICES = "http://127.0.0.1:8000/api/devices/";

export default function ActionHistory() {
    const [data, setData] = useState([]);
    const [devices, setDevices] = useState([]);
    const [actions, setActions] = useState([]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("desc");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [deviceFilter, setDeviceFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [showDeviceFilter, setShowDeviceFilter] = useState(false);
    const [showActionFilter, setShowActionFilter] = useState(false);

    // Lấy danh sách thiết bị
    const fetchDevices = async () => {
        try {
        const res = await fetch(API_DEVICES, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        const list = result.results || result;
        setDevices(list);
        } catch (err) {
        console.error("Lỗi fetch devices:", err);
        }
    };

    // Lấy dữ liệu lịch sử hành động
    const fetchData = async () => {
        try {
        const orderParam = sortOrder === "desc" ? `-${sortField}` : sortField;
        let url = `${API_ACTIONS}?page=${page}&page_size=${pageSize}&ordering=${orderParam}`;

        if (search) {
            if (filter === "all") url += `&search=${encodeURIComponent(search)}`;
            else url += `&${filter}=${encodeURIComponent(search)}`;
        }
        if (deviceFilter !== "all") url += `&device=${encodeURIComponent(deviceFilter)}`;
        if (actionFilter !== "all") url += `&action=${encodeURIComponent(actionFilter)}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        const items = result.results || [];

        setData(items);
        setTotalPages(Math.ceil(result.count / pageSize) || 1);

        // Cập nhật danh sách hành động có sẵn
        const uniqueActions = Array.from(new Set(items.map((i) => i.action)));
        setActions(uniqueActions);
        } catch (err) {
        console.error("Lỗi fetch actions:", err);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, pageSize, sortField, sortOrder, deviceFilter, actionFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const handleSort = (field) => {
        if (sortField === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
        setSortField(field);
        setSortOrder("asc");
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="sort-icon" />;
        return sortOrder === "asc" ? (
        <FaSortUp className="sort-icon" />
        ) : (
        <FaSortDown className="sort-icon" />
        );
    };

    const formatTime = (t) => {
        const d = new Date(t);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
        ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    };

    return (
        <div className="data-sensor-page">
        <h2>Lịch sử hành động</h2>

        {/* Thanh công cụ */}
        <div className="toolbar">
            <div className="toolbar-left">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="device">Thiết bị</option>
                <option value="action">Hành động</option>
                <option value="time">Thời gian</option>
            </select>

            <div className="search-box">
                <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <FaSearch className="search-icon" />
            </div>
            </div>

            <div className="toolbar-right">
            <select
                onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
                }}
                value={pageSize}
            >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
                <option value="100">100 / trang</option>
            </select>
            </div>
        </div>

        {/* Bảng dữ liệu */}
        <table className="data-table">
            <thead>
            <tr>
                <th onClick={() => handleSort("id")}>
                <div className="sortable">
                    <span>ID</span> {renderSortIcon("id")}
                </div>
                </th>

                <th>
                <div className="sortable">
                    <span>Thiết bị</span>
                    <FaFilter
                    className="filter-icon"
                    onClick={() => setShowDeviceFilter(!showDeviceFilter)}
                    />
                </div>
                {showDeviceFilter && (
                    <div className="filter-dropdown">
                    <select
                        value={deviceFilter}
                        onChange={(e) => {
                        setDeviceFilter(e.target.value);
                        setShowDeviceFilter(false);
                        setPage(1);
                        }}
                    >
                        <option value="all">Tất cả</option>
                        {devices.map((d) => (
                        <option key={d.id} value={d.name}>
                            {d.name}
                        </option>
                        ))}
                    </select>
                    </div>
                )}
                </th>

                <th>
                <div className="sortable">
                    <span>Hành động</span>
                    <FaFilter
                    className="filter-icon"
                    onClick={() => setShowActionFilter(!showActionFilter)}
                    />
                </div>
                {showActionFilter && (
                    <div className="filter-dropdown">
                    <select
                        value={actionFilter}
                        onChange={(e) => {
                        setActionFilter(e.target.value);
                        setShowActionFilter(false);
                        setPage(1);
                        }}
                    >
                        <option value="all">Tất cả</option>
                        {actions.map((a) => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                        ))}
                    </select>
                    </div>
                )}
                </th>

                <th onClick={() => handleSort("time")}>
                <div className="sortable">
                    <span>Thời gian</span> {renderSortIcon("time")}
                </div>
                </th>
            </tr>
            </thead>

            <tbody>
            {data.length > 0 ? (
                data.map((item) => (
                <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.device_name}</td>
                    <td>{item.action}</td>
                    <td>{formatTime(item.time)}</td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan="4">Không có dữ liệu</td>
                </tr>
            )}
            </tbody>
        </table>

        {/* Phân trang */}
        <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            <FaArrowLeft />
            </button>
            <span>
            Trang {page}/{totalPages}
            </span>
            <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            >
            <FaArrowRight />
            </button>
        </div>
        </div>
  );
}
