import React, { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,} from "recharts";
import { FaTemperatureHigh, FaTint, FaLightbulb, FaToggleOn, FaToggleOff, FaFan, FaSnowflake,} from "react-icons/fa";
import "../styles/Dashboard.css";
import { API_URL, token } from "./config.jsx";

export default function Dashboard() {
    const [sensors, setSensors] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    const confirmCancelRef = useRef({});

    // ========== SENSOR ==========
    useEffect(() => {
        let mounted = true;
        const fetchSensors = async () => {
        try {
            const res = await fetch(`${API_URL}/sensors/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const list = data.results || data || [];
            if (list.length > 0 && mounted) {
                const lastTen = list.slice(-10).map((item) => ({
                    ...item,
                    time: new Date(item.time).toLocaleTimeString("vi-VN", {
                    hour12: false,
                    timeZone: "Asia/Ho_Chi_Minh",
                    }),
                }));
                setSensors(lastTen.reverse());
            }
        } catch (err) {
            console.error("Lỗi fetch sensors:", err);
        } finally {
            if (mounted) setLoading(false);
        }
        };

        fetchSensors();
        const interval = setInterval(fetchSensors, 4000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // ========== FETCH DEVICE LIST + INITIAL STATUS ==========
    useEffect(() => {
        let mounted = true;
        const fetchDevices = async () => {
        try {
            const res = await fetch(`${API_URL}/devices/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const rawList = (data.results || data || []).map((d) => ({
                ...d,
                status: "UNKNOWN", // mặc định
            }));

            const filteredList = rawList
                .filter((d) => (d.name || "").toLowerCase() !== "led cảnh báo")
                .slice(0, 4);
            if (!mounted) return;
            setDevices(filteredList);

            // Lấy trạng thái lần đầu cho từng device
            for (const device of filteredList) {
                try {
                    const sres = await fetch(`${API_URL}/devices/${device.id}/status/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const sdata = await sres.json();
                    if (!mounted) return;
                    setDevices((prev) => prev.map((p) => (p.id === device.id ? { ...p, status: sdata.status || "UNKNOWN" } : p)));
                } catch (e) {
                    console.error("Lỗi fetch status cho device", device.id, e);
                }
            }
        } catch (err) {
            console.error("Lỗi fetch devices:", err);
        }
        };

        fetchDevices();
        return () => {
            mounted = false;
            Object.keys(confirmCancelRef.current).forEach((k) => (confirmCancelRef.current[k] = true));
        };
    }, []);

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const waitForConfirmation = async (deviceId, desiredStatus, {
        intervalMs = 1000,
        maxAttempts = 10,
    } = {}) => {
        confirmCancelRef.current[deviceId] = false;
        for (let i = 0; i < maxAttempts; i++) {
            if (confirmCancelRef.current[deviceId]) throw new Error("cancelled");
            await sleep(intervalMs);
            try {
                const res = await fetch(`${API_URL}/devices/${deviceId}/status/`, {
                headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) continue;
                const data = await res.json();
                const got = (data.status || "").toUpperCase();
                if (got === desiredStatus.toUpperCase()) {
                    return { ok: true, status: got, info: data };
                }
            } catch (err) {
                // ignore and retry
            }
        }
        return { ok: false };
    };

    // Try POST to /control/ then fallback /action/
    const postCommand = async (deviceId, action) => {
        const urls = [
        `${API_URL}/devices/${deviceId}/control/`,
        `${API_URL}/devices/${deviceId}/action/`,
        ];
        const body = JSON.stringify({ action });
        for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body,
            });
            if (res.status === 404) continue;
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                return { ok: true, url, data };
            } else {
                const data = await res.json().catch(() => ({}));
                return { ok: false, error: data, status: res.status };
            }
        } catch (err) {
            console.error("postCommand error", url, err);
        }
        }
        return { ok: false, error: "No endpoint available" };
    };

    // ========== ACTION HANDLER ==========
    const handleAction = async (deviceId, currentStatus) => {
        // prevent double-click if already pending
        const dev = devices.find((d) => d.id === deviceId);
        if (!dev) return;
        if (dev.status === "PENDING") return;

        const desired = (currentStatus || "UNKNOWN") === "ON" ? "OFF" : "ON";

        // 1. gửi lệnh
        const sent = await postCommand(deviceId, desired);
        if (!sent.ok) {
        console.error("Không gửi được lệnh:", sent);
        alert("Không gửi được lệnh đến server.");
        return;
        }

        // 2. set pending UI (KHÔNG đánh bật thành ON/OFF ngay)
        setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: "PENDING" } : d)));

        // 3. poll status API cho tới khi backend xác nhận
        try {
        const result = await waitForConfirmation(deviceId, desired, { intervalMs: 1000, maxAttempts: 12 });
        if (result.ok) {
            setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: result.status } : d)));
        } else {
            // timeout
            setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: "UNKNOWN" } : d)));
            alert("Thiết bị không phản hồi sau một khoảng thời gian. Vui lòng thử lại.");
        }
        } catch (err) {
        // cancelled
        setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: "UNKNOWN" } : d)));
        console.warn("Polling cancelled for device", deviceId);
        } finally {
        delete confirmCancelRef.current[deviceId];
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;

    const latest = sensors[sensors.length - 1] || {};
    const previous = sensors.length > 1 ? sensors[sensors.length - 2] : null;
    const compareIcon = (key) => {
        if (!previous) return "–";
        if (latest[key] > previous[key]) return "🔺";
        if (latest[key] < previous[key]) return "🔻";
        return "–";
    };

    const getDeviceIcon = (name, status) => {
        const active = status === "ON";
        const lower = (name || "").toLowerCase();
        if (lower.includes("quạt")) return <FaFan color={active ? "#00d897" : "#888"} size={22} className={active ? "spin" : ""} />;
        if (lower.includes("điều hòa")) return <FaSnowflake color={active ? "#48cae4" : "#888"} size={22} />;
        if (lower.includes("đèn")) return <FaLightbulb color={active ? "#f9c74f" : "#888"} size={22} />;
        return <FaToggleOff color="#888" size={22} />;
    };

    return (
        <div className="dashboard">
        <div className="dashboard-container">
            {/* LEFT */}
            <div className="left-panel">
            <h2>Thông tin cảm biến</h2>
            <div className="sensor-cards">
                <div className="sensor-card temp">
                <div className="icon"><FaTemperatureHigh color="#ff4d4d" size={28} /></div>
                <div className="info"><h3>Nhiệt độ</h3><p>{latest.temperature}°C {compareIcon("temperature")}</p></div>
                </div>
                <div className="sensor-card hum">
                <div className="icon"><FaTint color="#007bff" size={28} /></div>
                <div className="info"><h3>Độ ẩm</h3><p>{latest.humidity}% {compareIcon("humidity")}</p></div>
                </div>
                <div className="sensor-card light">
                <div className="icon"><FaLightbulb color="#f9c74f" size={28} /></div>
                <div className="info"><h3>Ánh sáng</h3><p>{latest.light} lux {compareIcon("light")}</p></div>
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
                    <Line type="monotone" dataKey="temperature" stroke="#ff4d4d" name="Nhiệt độ (°C)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="humidity" stroke="#007bff" name="Độ ẩm (%)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="light" stroke="#f9c74f" name="Ánh sáng" isAnimationActive={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* RIGHT */}
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
                    className={`device-btn ${device.status === "ON" ? "on" : "off"}`}
                    onClick={() => handleAction(device.id, device.status)}
                    disabled={device.status === "PENDING"}
                    >
                    {device.status === "ON" ? <FaToggleOn color="green" size={20} /> : <FaToggleOff color="gray" size={20} />}
                    <span style={{ marginLeft: 5, color: device.status === "ON" ? "white" : "gray" }}>
                        {device.status === "PENDING" ? "Đang chờ..." : device.status}
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
