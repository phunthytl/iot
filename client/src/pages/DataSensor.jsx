import React, { useEffect, useState } from "react";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import "../styles/DataSensor.css";

const API_URL = "http://127.0.0.1:8000/api/sensors/";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwOTI0NTYwLCJpYXQiOjE3NTkzODg1NjAsImp0aSI6ImM5ZmQ0MmMwZWJkNzRkNjI5MWQ3MjZlM2MxOGQzYTI2IiwidXNlcl9pZCI6MX0.oq1HB8vn1EwFDUzlFEAhERBzfGOEt7WyMaRlmA3sxkg";

export default function DataSensor() {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [sortField, setSortField] = useState("id");
    const [sortOrder, setSortOrder] = useState("desc");

    // Gọi API
    const fetchData = () => {
        const orderParam = sortOrder === "desc" ? `-${sortField}` : sortField;

        let url = `${API_URL}?page=${page}&page_size=${pageSize}&ordering=${orderParam}`;
        if (filter !== "all" && search) {
        url += `&${filter}=${encodeURIComponent(search)}`;
        } else if (search) {
        url += `&search=${encodeURIComponent(search)}`;
        }

        fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((res) => {
            setData(res.results || []);
            setTotalPages(Math.ceil(res.count / pageSize) || 1);
        })
        .catch((err) => console.error("Lỗi fetch:", err));
    };

    useEffect(() => {
        fetchData();
    }, [page, pageSize, sortField, sortOrder, filter]);

    // ✅ Enter mới tìm
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
        setPage(1);
        fetchData();
        }
    };

    // ✅ Sort mỗi cột
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
        <h2>Dữ liệu cảm biến</h2>

        <div className="toolbar">
            <div className="toolbar-left">
            <select onChange={(e) => setFilter(e.target.value)} value={filter}>
                <option value="all">Tất cả</option>
                <option value="temperature">Nhiệt độ</option>
                <option value="humidity">Độ ẩm</option>
                <option value="light">Ánh sáng</option>
                <option value="time">Thời gian</option>
            </select>

            <div className="search-box">
                <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                
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

        <table className="data-table">
            <thead>
            <tr>
                <th onClick={() => handleSort("id")}>
                <div className="sortable">
                    <span>ID</span> {renderSortIcon("id")}
                </div>
                </th>
                <th onClick={() => handleSort("temperature")}>
                <div className="sortable">
                    <span>Nhiệt độ</span> {renderSortIcon("temperature")}
                </div>
                </th>
                <th onClick={() => handleSort("humidity")}>
                <div className="sortable">
                    <span>Độ ẩm</span> {renderSortIcon("humidity")}
                </div>
                </th>
                <th onClick={() => handleSort("light")}>
                <div className="sortable">
                    <span>Ánh sáng</span> {renderSortIcon("light")}
                </div>
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
                    <td>{item.temperature}</td>
                    <td>{item.humidity}</td>
                    <td>{item.light}</td>
                    <td>{formatTime(item.time)}</td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan="5">Không có dữ liệu</td>
                </tr>
            )}
            </tbody>
        </table>

        <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            <FaArrowLeft />
            </button>
            <span>
            Trang {page}/{totalPages}
            </span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            <FaArrowRight />
            </button>
        </div>
        </div>
    );
}
