import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import dp from '../assets/dp.webp';

function Stories() {
  const [stories, setStories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const response = await axios.get('/api/stories', config);
      if (response.data.success) {
        setStories(response.data.stories);
      }
    } catch (error) {
      console.error('Load stories error:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      } else {
        alert('Please select an image or video file');
      }
    }
  };

  const handleCreateStory = async () => {
    if (!mediaFile) {
      alert('Please select a media file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('text', storyText);

      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      };

      await axios.post('/api/stories/create', formData, config);
      
      setShowCreateModal(false);
      setMediaFile(null);
      setMediaPreview(null);
      setStoryText('');
      loadStories();
    } catch (error) {
      console.error('Create story error:', error);
      alert('Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  const handleViewStory = async (storyGroup, index = 0) => {
    setSelectedStoryGroup(storyGroup);
    setCurrentStoryIndex(index);
    setSelectedStory(storyGroup.stories[index]);
    setShowStoryModal(true);

    // Mark as viewed
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      await axios.post(
        `/api/stories/view/${storyGroup.stories[index]._id}`,
        {},
        config
      );
    } catch (error) {
      console.error('View story error:', error);
    }
  };

  const handleNextStory = () => {
    if (!selectedStoryGroup) return;
    
    const nextIndex = currentStoryIndex + 1;
    if (nextIndex < selectedStoryGroup.stories.length) {
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(selectedStoryGroup.stories[nextIndex]);
    } else {
      setShowStoryModal(false);
    }
  };

  const handlePrevStory = () => {
    if (!selectedStoryGroup) return;
    
    const prevIndex = currentStoryIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStoryIndex(prevIndex);
      setSelectedStory(selectedStoryGroup.stories[prevIndex]);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        
        {/* Add Story Button */}
        <div 
          className="flex-shrink-0 w-20 cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-lg hover:scale-105 transition-all">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs text-center mt-2 text-white font-medium">Add Story</p>
        </div>

        {/* Story Circles */}
        {stories.map((storyGroup) => (
          <div 
            key={storyGroup.user._id}
            className="flex-shrink-0 w-20 cursor-pointer"
            onClick={() => handleViewStory(storyGroup)}
          >
            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105 transition-all">
              <div className="w-full h-full rounded-full border-2 border-slate-800 overflow-hidden">
                <img 
                  src={storyGroup.user.profileImage || dp}
                  alt={storyGroup.user.userName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-xs text-center mt-2 text-white font-medium truncate">
              {storyGroup.user.firstName}
            </p>
          </div>
        ))}
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-slate-800 rounded-2xl p-6 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create Story</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />

            {mediaPreview ? (
              <div className="mb-4">
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="w-full rounded-lg" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full rounded-lg" />
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
              >
                <Plus className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">Click to select media</p>
              </div>
            )}

            <textarea
              placeholder="Add a caption..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStory}
                disabled={!mediaFile || uploading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {uploading ? 'Posting...' : 'Post Story'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Story Modal */}
      {showStoryModal && selectedStory && (
        <>
          <div 
            className="fixed inset-0 bg-black z-50"
            onClick={() => setShowStoryModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="relative w-full max-w-md h-screen bg-black">
              
              {/* Close Button */}
              <button
                onClick={() => setShowStoryModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Story Header */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStoryGroup?.user.profileImage || dp}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <div>
                    <p className="text-white font-semibold">
                      {selectedStoryGroup?.user.firstName} {selectedStoryGroup?.user.lastName}
                    </p>
                    <p className="text-white text-xs opacity-75">
                      {new Date(selectedStory.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-white">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{selectedStory.views?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Story Content */}
              <div className="w-full h-full flex items-center justify-center">
                {selectedStory.mediaType === 'video' ? (
                  <video 
                    src={selectedStory.media} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <img 
                    src={selectedStory.media} 
                    alt="Story" 
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Story Text */}
              {selectedStory.text && (
                <div className="absolute bottom-20 left-0 right-0 p-4">
                  <p className="text-white text-center bg-black/50 rounded-lg p-3">
                    {selectedStory.text}
                  </p>
                </div>
              )}

              {/* Navigation */}
              {currentStoryIndex > 0 && (
                <button
                  onClick={handlePrevStory}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}
              {currentStoryIndex < (selectedStoryGroup?.stories.length || 0) - 1 && (
                <button
                  onClick={handleNextStory}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Stories;