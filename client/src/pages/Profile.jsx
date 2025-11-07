import React from "react";
import { FaGithub, FaFilePdf, FaFileWord } from "react-icons/fa";
import "../styles/Profile.css";
import avatar from "../files/avatar.jpg";
import pdf from "../files/BaoCaoIOT.pdf";

export default function Profile() {
    const profile = {
        name: "Nguyễn Văn Phú",
        student_id: "B22DCCN623",
        image: avatar,
        github: "https://github.com/phunthytl/iot.git",
        pdf: pdf,
        apidocx: "https://documenter.getpostman.com/view/39132195/2sB3QNq8j3",
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
