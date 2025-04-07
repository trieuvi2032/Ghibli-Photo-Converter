"use client";

import { useState } from "react";
import ImageUpload from "../components/ImageUpload";

export default function Home() {
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleImageConverted = (_originalUrl: string, convertedUrl: string) => {
    setConvertedImage(convertedUrl);
    setIsConverting(false);
    setConversionProgress("");
    setError(null);
  };

  const handleStartConverting = () => {
    setIsConverting(true);
    setConversionProgress("Starting conversion...");
    setError(null);
  };

  const handleProgressUpdate = (progress: string) => {
    setConversionProgress(progress);
  };

  const handleDownload = () => {
    if (!convertedImage) return;

    const a = document.createElement("a");
    a.href = convertedImage;
    a.download = "ghibli-style-image.png";
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleError = (errorMessage: string) => {
    setIsConverting(false);
    setConversionProgress("");
    setError(errorMessage);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-4xl font-bold text-center mb-6">
        Ghibli Photo Converter
      </h1>
      <p className="text-center mb-8">
        Transform your photos into beautiful Studio Ghibli-style artwork
      </p>

      <div className="flex flex-col items-center gap-8">
        <div className="w-[500px]">
          <ImageUpload
            onImageConverted={handleImageConverted}
            onStartConverting={handleStartConverting}
            onProgress={handleProgressUpdate}
            isConverting={isConverting}
            onError={handleError}
          />
          {(isConverting || conversionProgress) && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600 font-medium mb-2">
                {conversionProgress || "Converting your image..."}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-red-500 shadow-lg">
              <div className="flex items-center text-red-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{error}</p>
            </div>
          )}
        </div>

        {convertedImage && (
          <div className="w-full max-w-md flex flex-col items-center">
            {/* 💥 Removed extra box + padding here */}
            <img
              src={convertedImage}
              alt="Ghibli Style"
              className="w-full h-auto rounded-lg"
            />
            <div className="p-4 flex flex-col items-center gap-2">
              <p className="text-sm text-white-600 mb-1">
                Your Ghibli-style image is ready!
              </p>
              <button onClick={handleDownload}>
                <div className="border-2 rounded-lg mx-2 px-4 py-2">
                  <span className="font-medium px-5">Download Image</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
