import React, { useState, useRef } from 'react';
import './App.css';
import { saveAs } from 'file-saver';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPublicId, setUploadedPublicId] = useState('');
  const [uploadedAssetId, setUploadedAssetId] = useState('');
  const [duration, setDuration] = useState(0);
  const [trimmedUrl, setTrimmedUrl] = useState('');
  const [trimming, setTrimming] = useState(false);
  const [message, setMessage] = useState('');
  const [sliderStartTime, setSliderStartTime] = useState(0);
  const [sliderEndTime, setSliderEndTime] = useState(0);
  const videoRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setMessage('');
    setTrimmedUrl('');
    setSliderStartTime(0);
    setSliderEndTime(0);
    setUploadedPublicId('');
    setUploadedAssetId('');
    setDuration(0);

    if (file && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
      videoRef.current.style.display = 'block';
      videoRef.current.load();
    } else {
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.style.display = 'none';
      }
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        alert('Please select a file to upload.');
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('File uploaded successfully:', responseData);

      const { public_id, asset_id, url } = responseData.cloudinaryUploadResponse;

      setUploadedPublicId(public_id);
      setUploadedAssetId(asset_id);

      // Set video URL directly from Cloudinary
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.addEventListener('loadedmetadata', handleVideoLoaded);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setSliderStartTime(0);
      setSliderEndTime(videoDuration);
    }
  };

  const handleTrim = async () => {
    try {
      if (!uploadedPublicId || !uploadedAssetId || sliderStartTime === null || sliderEndTime === null) {
        alert('Please upload a file and specify start and end times.');
        return;
      }

      setTrimming(true);

      const s1 = formatTime(sliderStartTime);
      const e1 = formatTime(sliderEndTime);

      const trimData = {
        public_id: uploadedPublicId,
        asset_id: uploadedAssetId,
        start_time: s1,
        end_time: e1,
      };

      const response = await fetch('http://localhost:3000/trim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Video trimmed successfully:', responseData);

      setTrimmedUrl(responseData.trimmedUrl);
      setMessage('Video trimmed successfully');
    } catch (error) {
      console.error('Error trimming video:', error);
      setMessage('Error trimming video');
    } finally {
      setTrimming(false);
    }
  };

  const handleDownload = async (url) => {
    try {
      const blob = await fetch(url).then((res) => res.blob());
      saveAs(blob, 'trimmed_video.mp4');
    } catch (error) {
      console.error('Error downloading video:', error);
      setMessage('Error downloading video');
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSliderStartTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value <= sliderEndTime) {
      setSliderStartTime(value);
      if (videoRef.current) {
        videoRef.current.currentTime = value;
      }
    }
  };

  const handleSliderEndTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value >= sliderStartTime) {
      setSliderEndTime(value);
      if (videoRef.current) {
        videoRef.current.currentTime = value;
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Video Upload and Trim</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <br />
        {selectedFile && (
          <div className="video1">
            <video
            ref={videoRef}
            controls
            style={{ display: 'block' }}
          />
          </div>

          
        )}
        {uploadedPublicId && (
          <div className="trim-section">
            <p>Video Duration: {formatTime(duration)}</p>
            <label>Start Time: {formatTime(sliderStartTime)}</label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.02"
              value={sliderStartTime}
              onChange={handleSliderStartTimeChange}
              disabled={trimming}
            />
            <label>End Time: {formatTime(sliderEndTime)}</label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.02"
              value={sliderEndTime}
              onChange={handleSliderEndTimeChange}
              disabled={trimming}
            />
            <button onClick={handleTrim} disabled={sliderStartTime >= sliderEndTime || trimming}>
              {trimming ? 'Trimming...' : 'Trim Video'}
            </button>
            <br />
            <p className="message">{message}</p>
            {trimmedUrl && (
              <div className="trimmed-url">
                <p>Trimmed Video URL:</p>
                <a
                  href={trimmedUrl}
                  download="trimmed_video.mp4"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownload(trimmedUrl);
                  }}
                >
                  Download Trimmed Video
                </a>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
