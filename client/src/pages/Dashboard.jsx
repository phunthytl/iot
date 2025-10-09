import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    FaTemperatureHigh,
    FaTint,
    FaLightbulb,
    FaToggleOn,
    FaToggleOff,
    FaFan,
    FaSnowflake,
} from "react-icons/fa";
import "../styles/Dashboard.css";

const API_URL = "http://127.0.0.1:8000/api";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkwOTI0NTYwLCJpYXQiOjE3NTkzODg1NjAsImp0aSI6ImM5ZmQ0MmMwZWJkNzRkNjI5MWQ3MjZlM2MxOGQzYTI2IiwidXNlcl9pZCI6MX0.oq1HB8vn1EwFDUzlFEAhERBzfGOEt7WyMaRlmA3sxkg";

export default function Dashboard() {
    const [sensors, setSensors] = useState([]);
    const [prevData, setPrevData] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch cảm biến mỗi 2s
    useEffect(() => {
    const fetchSensors = async () => {
        try {
        const res = await fetch(`${API_URL}/sensors/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            // Format thời gian ngay tại đây
            const formatted = data.results.slice(-10).map((item) => ({
            ...item,
            time: new Date(item.time).toLocaleTimeString("vi-VN", {
                hour12: false,
                timeZone: "Asia/Ho_Chi_Minh",
            }),
            }));

            setPrevData((prev) => sensors[sensors.length - 1]);
            setSensors(formatted);
        }
        setLoading(false);
        } catch (err) {
        console.error("Lỗi fetch sensors:", err);
        setLoading(false);
        }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 2000);
    return () => clearInterval(interval);
    }, []);
    // Fetch danh sách thiết bị
    useEffect(() => {
        fetch(`${API_URL}/devices/`, {
        headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((data) => {
            const list = (data.results || data).map((d) => ({
            ...d,
            status: false,
            }));
            setDevices(list);
        })
        .catch((err) => console.error("Lỗi fetch devices:", err));
    }, []);

    // Gửi hành động ON/OFF
    const handleAction = async (deviceId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
        await fetch(`${API_URL}/devices/${deviceId}/action/`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: newStatus ? "ON" : "OFF" }),
        });
        setDevices((prev) =>
            prev.map((d) => (d.id === deviceId ? { ...d, status: newStatus } : d))
        );
        } catch (err) {
        console.error("Lỗi gửi hành động:", err);
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;

    const latest = sensors[sensors.length - 1] || {};
    const compareIcon = (key) => {
        if (!prevData) return "–";
        if (latest[key] > prevData[key]) return "🔺";
        if (latest[key] < prevData[key]) return "🔻";
        return "–";
    };

    // Icon cho từng thiết bị
    const getDeviceIcon = (name, status) => {
        name = name.toLowerCase();
        if (name.includes("quạt")) {
        return (
            <FaFan
            color={status ? "#00d897ff" : "#888"}
            size={22}
            className={status ? "spin" : ""}
            />
        );
        }
        if (name.includes("điều hòa")) {
        return <FaSnowflake color={status ? "#48cae4" : "#888"} size={22} />;
        }
        if (name.includes("đèn")) {
        return <FaLightbulb color={status ? "#f9c74f" : "#888"} size={22} />;
        }
        return <FaToggleOff color="#888" size={22} />;
    };

    return (
        <div className="dashboard">
        <div className="dashboard-container">
            {/* Cột trái */}
            <div className="left-panel">
            <h2>Thông tin cảm biến</h2>
            <div className="sensor-cards">
                <div className="sensor-card temp">
                <div className="icon">
                    <FaTemperatureHigh color="#ff4d4d" size={28} />
                </div>
                <div className="info">
                    <h3>Nhiệt độ</h3>
                    <p>
                    {latest.temperature}°C {compareIcon("temperature")}
                    </p>
                </div>
                </div>

                <div className="sensor-card hum">
                <div className="icon">
                    <FaTint color="#007bff" size={28} />
                </div>
                <div className="info">
                    <h3>Độ ẩm</h3>
                    <p>
                    {latest.humidity}% {compareIcon("humidity")}
                    </p>
                </div>
                </div>

                <div className="sensor-card light">
                <div className="icon">
                    <FaLightbulb color="#f9c74f" size={28} />
                </div>
                <div className="info">
                    <h3>Ánh sáng</h3>
                    <p>
                    {latest.light} lux {compareIcon("light")}
                    </p>
                </div>
                </div>
            </div>

            <div className="chart-box">
                <h3>Biểu đồ cảm biến</h3>
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sensors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ff4d4d"
                    name="Nhiệt độ (°C)"
                    />
                    <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#007bff"
                    name="Độ ẩm (%)"
                    />
                    <Line
                    type="monotone"
                    dataKey="light"
                    stroke="#f9c74f"
                    name="Ánh sáng"
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Cột phải */}
            <div className="right-panel">
            <h3>Điều khiển thiết bị</h3>
            <div className="device-list">
                {devices.map((device) => (
                <div key={device.id} className="device-card">
                    <div className="device-info">
                    {getDeviceIcon(device.name, device.status)}
                    <span className="device-name">{device.name}</span>
                    </div>

                    <button
                    className={`device-btn ${device.status ? "on" : "off"}`}
                    onClick={() => handleAction(device.id, device.status)}
                    >
                    {device.status ? (
                        <FaToggleOn color="green" size={20} />
                    ) : (
                        <FaToggleOff color="gray" size={20} />
                    )}
                    <span style={{ marginLeft: 5, color: device.status ? "white" : "gray" }}>
                        {device.status ? "ON" : "OFF"}
                    </span>
                    </button>
                </div>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
}
