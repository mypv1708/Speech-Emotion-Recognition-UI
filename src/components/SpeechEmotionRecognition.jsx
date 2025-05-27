import React, { useState, useEffect } from "react";
import {
  FiUpload,
  FiMusic,
  FiSmile,
  FiFrown,
  FiPlay,
  FiPause,
} from "react-icons/fi";

const SpeechEmotionRecognition = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Cleanup function to stop any playing audio when component unmounts or when new file is selected
  useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
      }
    };
  }, [playingAudio]);

  // Function to convert file path to audio URL
  const getAudioUrl = (filePath) => {
    if (!filePath) return null;
    // Create URL for the audio file using the backend audio endpoint
    return `http://localhost:8386${filePath}`;
  };

  const handleFileChange = (e) => {
    // Stop any playing audio
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }

    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "audio/wav") {
      setFile(selectedFile);
      setError(null);
      setResult(null); // Clear previous results
    } else {
      setError("Please select a valid WAV file");
      setFile(null);
      setResult(null); // Clear results if invalid file is selected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    // Stop any playing audio
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }

    setLoading(true);
    setError(null);
    setResult(null); // Reset previous results

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8386/predict-emotion/", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail ||
            `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error details:", err);
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError(
          "Unable to connect to the server. Please check if the server is running at http://localhost:8386"
        );
      } else {
        setError(err.message || "An error occurred while analyzing the audio");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (filePath) => {
    const audioUrl = getAudioUrl(filePath);
    if (!audioUrl) return;

    if (playingAudio) {
      playingAudio.pause();
      if (playingAudio.src === audioUrl) {
        setPlayingAudio(null);
        return;
      }
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setError("Failed to play audio file");
      setPlayingAudio(null);
    };
    audio.play().catch((err) => {
      console.error("Audio play error:", err);
      setError("Failed to play audio file");
      setPlayingAudio(null);
    });
    setPlayingAudio(audio);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Speech Emotion Recognition
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <FiMusic className="w-12 h-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept=".wav"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                <FiUpload className="inline-block mr-2" />
                Choose WAV File
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                !file || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } transition-colors`}
            >
              {loading ? "Analyzing..." : "Analyze Emotion"}
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-8">
            {/* Original File Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Original Audio
              </h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {result.original_file}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Duration: {result.original_duration.toFixed(2)}s
                  </p>
                </div>
                <button
                  onClick={() => handlePlayAudio(result.original_file_path)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {playingAudio?.src ===
                  getAudioUrl(result.original_file_path) ? (
                    <FiPause className="mr-2" />
                  ) : (
                    <FiPlay className="mr-2" />
                  )}
                  {playingAudio?.src === getAudioUrl(result.original_file_path)
                    ? "Pause"
                    : "Play"}
                </button>
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Analysis Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiSmile className="w-6 h-6 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Positive Emotion
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {result.overview_percentage.positive_percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiFrown className="w-6 h-6 text-red-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Negative Emotion
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {result.overview_percentage.negative_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Emotion Percentages Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Emotion Distribution
              </h2>
              <div className="space-y-4">
                {Object.entries(result.emotion_percentages)
                  .filter(([_, percentage]) => percentage > 0)
                  .map(([emotion, percentage]) => (
                    <div key={emotion} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">
                          {emotion}
                        </span>
                        <span className="text-lg font-semibold text-gray-700">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            emotion === "Thân Thiện" || emotion === "Vui Vẻ"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Detailed Results Section */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Detailed Analysis
              </h2>
              <div className="space-y-4">
                {result.predictions_details.map((prediction, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {prediction.file}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Duration: {prediction.duration.toFixed(2)}s
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            prediction.emotion === "Thân Thiện" ||
                            prediction.emotion === "Vui Vẻ"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {prediction.emotion}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(prediction.file_path)}
                          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          {playingAudio?.src ===
                          getAudioUrl(prediction.file_path) ? (
                            <FiPause className="mr-1" />
                          ) : (
                            <FiPlay className="mr-1" />
                          )}
                          {playingAudio?.src ===
                          getAudioUrl(prediction.file_path)
                            ? "Pause"
                            : "Play"}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Probability</p>
                        <p className="text-lg font-semibold">
                          {prediction.probability.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechEmotionRecognition;
