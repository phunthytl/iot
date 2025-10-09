import React from "react";
import { FaGithub, FaFilePdf, FaFileWord } from "react-icons/fa";
import "../styles/Profile.css";

export default function Profile() {
    const profile = {
        name: "Nguyễn Văn Phú",
        student_id: "B22DCCN623",
        image: "/files/profile.jpg",
        github: "https://github.com/phunthytl/iot.git",
        pdf: "/files/CV_NguyenVanPhu.pdf",
        apidocx: "https://web.postman.co/workspace/6501ebf8-9385-4f4c-82b2-aae12ffe2927/collection/39132195-27f5c9d9-b765-46f7-827f-cb2b9cc0d0a6?action=share&source=copy-link&creator=39132195",
    };

    return (
        <div className="profile-container">
        <div className="profile-card">
            <img src={profile.image} alt="Avatar" className="profile-avatar" />

            <h2 className="profile-name">{profile.name}</h2>
            <p className="profile-id">Mã sinh viên: {profile.student_id}</p>

            <div className="profile-links">
            <a href={profile.github} target="_blank" rel="noreferrer">
                <FaGithub /> GitHub
            </a>
            <a href={profile.pdf} target="_blank" rel="noreferrer">
                <FaFilePdf /> PDF
            </a>
            <a href={profile.apidocx} target="_blank" rel="noreferrer">
                <FaFileWord /> APIdocx
            </a>
            </div>
        </div>
        </div>
    );
}
