import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaChartBar,
  FaClock,
  FaUser,
} from "react-icons/fa";
import "../styles/Header.css";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: <FaHome />, path: "/dashboard" },
        { key: "dashboard-2", label: "Dashboard2", icon: <FaHome />, path: "/dashboard2" },
        { key: "datasensor", label: "Data Sensor", icon: <FaChartBar />, path: "/datasensor" },
        { key: "action", label: "Action History", icon: <FaClock />, path: "/action" },
        { key: "profile", label: "Profile", icon: <FaUser />, path: "/profile" },
    ];

    // Xác định tab hiện tại dựa vào URL
    const currentTab = location.pathname.split("/")[1] || "dashboard";

    return (
        <div className="header">
        <div className="header-container">
            {tabs.map((tab) => (
            <div
                key={tab.key}
                className={`tab-button ${
                currentTab === tab.key ? "active" : ""
                }`}
                onClick={() => navigate(tab.path)}
            >
                <div className="tab-icon">{tab.icon}</div>
                <span>{tab.label}</span>
            </div>
            ))}
        </div>
        </div>
    );
}
