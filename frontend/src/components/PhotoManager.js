import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoManager.css';
import { getImageUrl } from '../utils/imageUrl';

const PhotoManager = ({ itemId, photos = [], onUpdate, onLocalChange }) => {
    const [uploading, setUploading] = useState(false);
    const [localPhotos, setLocalPhotos] = useState([]); // [{id: tempId, url: blob, file: File, isPrimary: bool}]

    const localPhotosRef = React.useRef(localPhotos);
    useEffect(() => {
        localPhotosRef.current = localPhotos;
    }, [localPhotos]);

    // Clean up blob URLs when component unmounts
    useEffect(() => {
        return () => {
            localPhotosRef.current.forEach(p => {
                if (p.url && p.url.startsWith('blob:')) {
                    URL.revokeObjectURL(p.url);
                }
            });
        };
        // We only want this to run on unmount, but localPhotos is used for the ref update
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (itemId) {
            // SERVER MODE: Upload immediately
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));
            setUploading(true);
            try {
                await axios.post(`/api/admin/menu/items/${itemId}/photos`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                onUpdate();
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Failed to upload photos');
            } finally {
                setUploading(false);
            }
        } else {
            // LOCAL MODE: Add to local state
            const newLocalPhotos = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                url: URL.createObjectURL(file),
                file: file,
                isPrimary: false
            }));

            // If it's the first photo, make it primary
            if (localPhotos.length === 0 && newLocalPhotos.length > 0) {
                newLocalPhotos[0].isPrimary = true;
            }

            const updatedList = [...localPhotos, ...newLocalPhotos];
            setLocalPhotos(updatedList);
            if (onLocalChange) onLocalChange(updatedList);
        }
    };

    const handleDelete = async (photoId) => {
        if (!window.confirm('Delete this photo?')) return;

        if (itemId) {
            // SERVER MODE
            try {
                await axios.delete(`/api/admin/menu/items/${itemId}/photos/${photoId}`);
                onUpdate();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Failed to delete photo');
            }
        } else {
            // LOCAL MODE
            const target = localPhotos.find(p => p.id === photoId);
            if (target) URL.revokeObjectURL(target.url);

            const updatedList = localPhotos.filter(p => p.id !== photoId);
            // Re-assign primary if we deleted the primary one
            if (target?.isPrimary && updatedList.length > 0) {
                updatedList[0].isPrimary = true;
            }
            setLocalPhotos(updatedList);
            if (onLocalChange) onLocalChange(updatedList);
        }
    };

    const handleSetPrimary = async (photoId) => {
        if (itemId) {
            // SERVER MODE
            try {
                await axios.patch(`/api/admin/menu/items/${itemId}/photos/${photoId}/primary`);
                onUpdate();
            } catch (error) {
                console.error('Set primary failed:', error);
                alert('Failed to set primary photo');
            }
        } else {
            // LOCAL MODE
            const updatedList = localPhotos.map(p => ({
                ...p,
                isPrimary: p.id === photoId
            }));
            setLocalPhotos(updatedList);
            if (onLocalChange) onLocalChange(updatedList);
        }
    };

    // Use either server photos or local photos
    const displayPhotos = itemId ? photos : localPhotos;

    return (
        <div className="photo-manager">
            <label>
                Photos Management {itemId ? '' : '(Local Preview)'}
            </label>

            <div className="photo-grid">
                {displayPhotos.map((photo) => (
                    <div key={photo.id} className={`photo-item ${photo.isPrimary ? 'is-primary' : ''}`}>
                        <img src={getImageUrl(photo.url)} alt="Menu item" />
                        {photo.isPrimary && <span className="primary-badge">PRIMARY</span>}
                        {photo.sortOrder > 0 && <span className="order-badge">#{photo.sortOrder}</span>}

                        <div className="photo-actions">
                            <button
                                type="button"
                                className="photo-action-btn primary"
                                title="Set as primary"
                                onClick={() => handleSetPrimary(photo.id)}
                                disabled={photo.isPrimary}
                            >
                                ⭐
                            </button>
                            <button
                                type="button"
                                className="photo-action-btn delete"
                                title="Delete photo"
                                onClick={() => handleDelete(photo.id)}
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                ))}

                <div className="upload-placeholder">
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                    <label htmlFor="file-upload">
                        <span>{uploading ? '...' : '+'}</span>
                        <p>{uploading ? 'Uploading' : 'Add Photos'}</p>
                    </label>
                </div>
            </div>
            {!itemId && localPhotos.length > 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    * Photos will be uploaded when you click "Create Item".
                </p>
            )}
        </div>
    );
};

export default PhotoManager;
