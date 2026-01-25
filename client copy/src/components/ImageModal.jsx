import React from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
            <div className="relative max-w-4xl max-h-screen p-4">
                <button
                    className="absolute top-0 right-0 m-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 focus:outline-none"
                    onClick={onClose}
                >
                    &times;
                </button>
                <img
                    src={imageUrl}
                    alt="Expanded View"
                    className="max-h-[90vh] max-w-full rounded shadow-lg object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export default ImageModal;
