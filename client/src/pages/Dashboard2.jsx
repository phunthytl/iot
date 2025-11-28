import React, { useEffect, useState, useRef } from "react";
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,} from "recharts";
import { FaLightbulb, FaToggleOn, FaToggleOff, FaCloud } from "react-icons/fa";
import "../styles/Dashboard.css";
import { API_URL, token } from "./config.jsx";

export default function Dashboard2() {
    const [aqi, setAqi] = useState(0);
    const [data, setData] = useState([]);
    const [ledWarning, setLedWarning] = useState(false);
    const [deviceLed, setDeviceLed] = useState({
        id: 4,
        name: "Đèn phòng",
        status: "OFF",
    });
    const [autoMode, setAutoMode] = useState(true);
    const confirmCancelRef = useRef(false);

    // Gửi lệnh điều khiển device
    const postDeviceCommand = async (deviceId, action) => {
        try {
            const res = await fetch(`${API_URL}/devices/${deviceId}/control/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            console.log(`📡 Gửi lệnh ${action} → device ${deviceId}`, data);
            return { ok: res.ok, data };
        } catch (e) {
            console.error("Error calling API:", e);
            return { ok: false, error: e };
        }
    };

    // Nhận trạng thái device
    const getDeviceStatus = async (deviceId) => {
        try {
            const res = await fetch(`${API_URL}/devices/${deviceId}/status/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            return data.status || "OFF";
        } catch {
            return "OFF";
        }
    };

    // Xử lý bật/tắt device
    const handleDeviceToggle = async () => {
        const desired = deviceLed.status === "ON" ? "OFF" : "ON";
        setDeviceLed((prev) => ({ ...prev, status: "PENDING" }));

        const result = await postDeviceCommand(deviceLed.id, desired);

        if (result.ok) {
            confirmCancelRef.current = false;
            let success = false;

            for (let i = 0; i < 10; i++) {
                if (confirmCancelRef.current) break;

                await new Promise((r) => setTimeout(r, 1000));
                const status = await getDeviceStatus(deviceLed.id);

                if (status === desired) {
                    success = true;
                    setDeviceLed((prev) => ({ ...prev, status }));
                    break;
                }
            }

            if (!success) setDeviceLed((prev) => ({ ...prev, status: "UNKNOWN" }));
        } else {
            alert("Không thể gửi lệnh điều khiển LED.");
            setDeviceLed((prev) => ({ ...prev, status: "UNKNOWN" }));
        }
    };

    // Lấy thông tin AQI
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/sensor-realtime/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const json = await res.json();
                const airValue = json.air ?? 0;

                setAqi(airValue);

                // Cập nhật biểu đồ
                setData(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.time === json.time) return prev;
                    return [...prev.slice(-19), { time: json.time, value: airValue }];
                });

                // Waring LED tự động
                const danger = airValue > 50;
                setLedWarning(danger);

            } catch (err) {
                console.error("Lỗi gọi API realtime:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <div className="left-panel">
                <h2><FaCloud color="#00b4d8" /> Biểu đồ chất lượng không khí</h2>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#00b4d8"
                            name="AQI"
                            isAnimationActive={false}
                        />
                        </LineChart>
                    </ResponsiveContainer>

                    <p style={{ textAlign: "center", marginTop: 10 }}>
                        Giá trị hiện tại:{" "}
                        <strong style={{ color: aqi > 50 ? "red" : "green" }}>
                        {aqi} {aqi > 50 ? "(Cảnh báo)" : "(Tốt)"}
                        </strong>
                    </p>
                </div>

                <div className="right-panel" style={{ alignItems: "center", justifyContent: "center" }}>
                <h3>Điều khiển LED</h3>

                    {/* LED cảnh báo */}
                    <div style={{ marginBottom: 40, textAlign: "center" }}>
                        <h4>LED Cảnh báo</h4>
                        <FaLightbulb
                        size={80}
                        color={ledWarning ? "#ff4d4d" : "#ccc"}
                        className={ledWarning ? "led-glow" : ""}
                        />
                        <p style={{ marginTop: 10 }}>
                        Trạng thái:{" "}
                        <strong style={{ color: ledWarning ? "red" : "gray" }}>
                            {ledWarning ? "BẬT (Vượt ngưỡng)" : "TẮT (An toàn)"}
                        </strong>
                        </p>
                        <button className="device-btn" onClick={() => setAutoMode((p) => !p)}>
                        {autoMode ? "Chế độ: Tự động" : "Chế độ: Thủ công"}
                        </button>
                    </div>

                    {/* LED điều khiển thủ công */}
                    <div style={{ textAlign: "center" }}>
                        <h4>LED Thiết bị</h4>
                        <FaLightbulb
                        size={80}
                        color={deviceLed.status === "ON" ? "#f9c74f" : "#999"}
                        />
                        <button
                        className={`device-btn ${deviceLed.status === "ON" ? "on" : "off"}`}
                        onClick={handleDeviceToggle}
                        style={{ marginLeft: 160 }}
                        disabled={deviceLed.status === "PENDING"}
                        >
                        {deviceLed.status === "ON" ? <FaToggleOn /> : <FaToggleOff />}
                        <span style={{ marginLeft: 5 }}>
                            {deviceLed.status === "PENDING"
                            ? "Đang chờ..."
                            : deviceLed.status === "ON"
                            ? "Tắt LED"
                            : "Bật LED"}
                        </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
