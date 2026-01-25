import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageModal from '../components/ImageModal';
import config from '../config';

const CircularManagement = () => {
    const [notices, setNotices] = useState([]);
    // State now holds an array of form objects
    const [forms, setForms] = useState([{ title: '', description: '', image: '' }]);
    const [message, setMessage] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${config.API_URL}/api/notices/all`, {
                headers: { 'x-auth-token': token }
            });
            setNotices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Handle text change for a specific form index
    const handleInputChange = (index, field, value) => {
        const newForms = [...forms];
        newForms[index][field] = value;
        setForms(newForms);
    };

    // Handle file change for a specific form index
    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newForms = [...forms];
                newForms[index].image = reader.result;
                setForms(newForms);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add a new empty form
    const addForm = () => {
        setForms([...forms, { title: '', description: '', image: '' }]);
    };

    // Remove a form by index
    const removeForm = (index) => {
        if (forms.length > 1) {
            const newForms = forms.filter((_, i) => i !== index);
            setForms(newForms);
        }
    };

    const postAllNotices = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const promises = forms.map(formData =>
                axios.post(`${config.API_URL}/api/notices/add`, formData, {
                    headers: { 'x-auth-token': token }
                })
            );

            await Promise.all(promises);

            setMessage('All Notices Posted Successfully');
            fetchNotices();
            setForms([{ title: '', description: '', image: '' }]); // Reset to one empty form
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error posting notices. Please try again.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const deleteNotice = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${config.API_URL}/api/notices/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Notice Deleted');
            fetchNotices();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error deleting notice');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalOpen(true);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Circular & Notice Board</h2>
            {message && <div className={`px-4 py-2 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

            <form onSubmit={postAllNotices} className="mb-6 space-y-6">
                {forms.map((form, index) => (
                    <div key={index} className="border p-4 rounded bg-gray-50 relative">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-700">Notice #{index + 1}</h4>
                            {forms.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeForm(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Notice Title</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded"
                                value={form.title}
                                onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Description</label>
                            <textarea
                                className="w-full border p-2 rounded h-24"
                                value={form.description}
                                onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Attach Image (Optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(index, e)}
                                className="w-full"
                            />
                            {form.image && <img src={form.image} alt="Preview" className="mt-2 h-20 w-auto rounded border" />}
                        </div>
                    </div>
                ))}

                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={addForm}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        + Add Another Notice
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {forms.length > 1 ? 'Post All Notices' : 'Post Notice'}
                    </button>
                </div>
            </form>

            <h3 className="text-lg font-semibold mb-3">Posted Notices</h3>
            <div className="space-y-4">
                {notices.map(notice => (
                    <div key={notice._id} className="border p-4 rounded bg-gray-50 flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg">{notice.title}</h4>
                            <p className="text-gray-600 text-sm mb-2">Posted on: {new Date(notice.date).toLocaleDateString()}</p>
                            <p className="text-gray-800">{notice.description}</p>
                            {notice.image && (
                                <img
                                    src={notice.image}
                                    alt="Notice"
                                    className="mt-3 max-h-40 rounded shadow cursor-pointer hover:opacity-90 transition"
                                    onClick={() => openModal(notice.image)}
                                />
                            )}
                        </div>
                        <button
                            onClick={() => deleteNotice(notice._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                ))}
                {notices.length === 0 && <p className="text-gray-500">No notices posted yet.</p>}
            </div>

            <ImageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                imageUrl={selectedImage}
            />
        </div>
    );
};

export default CircularManagement;

