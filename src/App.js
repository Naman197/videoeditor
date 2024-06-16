import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ReactPlayer from 'react-player';
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
  const [videoUrl, setVideoUrl] = useState('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [playing, setPlaying] = useState(false);

  const playerRef = useRef(null);

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
    setCloudinaryUrl('');

    if (file) {
      const url = URL.createObjectURL(file);
      setCloudinaryUrl(url);
    }
  };

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
    setMessage('');
    setTrimmedUrl('');
    setSliderStartTime(0);
    setSliderEndTime(0);
    setUploadedPublicId('');
    setUploadedAssetId('');
    setDuration(0);
    setCloudinaryUrl('');
  };

  const handleUpload = async () => {
    try {
      setUploading(true);

      if (selectedFile) {
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
        setCloudinaryUrl(url);
      } else if (videoUrl) {
        const response = await fetch(`http://localhost:3000/video-download1?url=${videoUrl}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Video URL submitted successfully:', responseData);

        const { public_id, asset_id, url } = responseData.result;

        setUploadedPublicId(public_id);
        setUploadedAssetId(asset_id);
        setCloudinaryUrl(url);
      } else {
        alert('Please select a file or enter a video URL.');
      }
    } catch (error) {
      console.error('Error uploading file or submitting URL:', error);
      setMessage('Error uploading file or submitting URL');
    } finally {
      setUploading(false);
    }
  };

  const handleDuration = (d) => {
    setDuration(d);
    setSliderEndTime(d);
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
      if (playerRef.current) {
        playerRef.current.seekTo(value, 'seconds');
      }
    }
  };

  const handleSliderEndTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value >= sliderStartTime) {
      setSliderEndTime(value);
      if (playerRef.current) {
        playerRef.current.seekTo(value, 'seconds');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Video Upload and Trim</h2>
        <div>
          <label>
            Upload video file:
            <input type="file" onChange={handleFileChange} />
          </label>
        </div>
        <div>
          <label>
            Or enter youtube URL:
            <input type="text" value={videoUrl} onChange={handleUrlChange} />
          </label>
        </div>
        <button onClick={handleUpload} disabled={!selectedFile && !videoUrl || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <br />
        {cloudinaryUrl && (
          <div className="video-section">
            <ReactPlayer
              ref={playerRef}
              url={cloudinaryUrl}
              controls
              playing={playing}
              onDuration={handleDuration}
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
