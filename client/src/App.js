import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import DataSensor from "./pages/DataSensor";
import Action from "./pages/Action";
import Profile from "./pages/Profile";

export default function App() {
    return (
        <BrowserRouter>
        <Header />
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/datasensor" element={<DataSensor />} />
            <Route path="/action" element={<Action />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
        </BrowserRouter>
    );
}
