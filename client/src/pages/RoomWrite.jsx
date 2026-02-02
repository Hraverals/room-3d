import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const RoomWrite = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false)

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        Array.from(files).forEach((file) => {
            formData.append('images', file);
        });

        try {
            const res = await axios.post(`${SERVER_URL}/api/room`, formData)
            navigate(`/${res.data.room.urlid}`)
        } catch (err) {
            alert("에러 발생");
        }
        setIsUploading(false);
    };

    return (
        <div className="flex justify-center py-10 bg-base-200 min-h-screen">
            <div className="card w-full max-w-lg bg-base-100 shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">매물 등록</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <div>
                        <label className="label font-semibold">이름</label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="방 이름 입력"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="label font-semibold">설명</label>
                        <textarea
                            className="textarea textarea-bordered w-full h-24 resize-none"
                            placeholder="상세 설명 입력"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label className="label font-semibold">사진 업로드</label>
                        <input
                            type="file"
                            multiple
                            className="file-input file-input-bordered file-input-primary w-full"
                            onChange={(e) => setFiles(e.target.files)}
                        />
                    </div>

                    <button className={`btn btn-primary mt-4 w-full ${isUploading ? 'btn-disabled' : ''}`}>
                        등록하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoomWrite;