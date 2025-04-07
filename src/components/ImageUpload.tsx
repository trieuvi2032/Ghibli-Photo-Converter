"use client";

import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";

interface ImageUploadProps {
  onImageConverted: (originalUrl: string, convertedUrl: string) => void;
  onStartConverting: () => void;
  onProgress: (progress: string) => void;
  isConverting: boolean;
  onError: (error: string) => void;
}

const MAX_WIDTH = 800;
const MAX_HEIGHT = 400;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/png",
        0.9
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
  });
}

export default function ImageUpload({
  onImageConverted,
  onStartConverting,
  onProgress,
  isConverting,
  onError,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUpload = () => {
    setError(null);
    setKey((prev) => prev + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    onStartConverting();

    if (file.size > MAX_FILE_SIZE) {
      const msg = "File size too large. Please upload an image under 4MB.";
      setError(msg);
      onError(msg);
      return;
    }

    try {
      onProgress("Preparing image...");
      const imageBlob = await resizeImage(file);
      const resizedFile = new File([imageBlob], "image.png", {
        type: "image/png",
      });

      onProgress("Uploading image...");
      const fileName = `${Date.now()}-${Math.random()}.png`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, resizedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      onProgress("Waiting for image to be available...");

      let isImageReady = false;
      for (let i = 0; i < 5; i++) {
        try {
          const check = await fetch(publicUrl, { method: "HEAD" });
          if (check.ok) {
            isImageReady = true;
            break;
          }
        } catch {}
        await new Promise((res) => setTimeout(res, 1000));
      }

      if (!isImageReady) {
        const msg = "Failed to load uploaded image from Supabase.";
        setError(msg);
        onError(msg);
        resetUpload();
        return;
      }

      onProgress("Converting image to Ghibli style...");

      let response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      let responseData = await response.json();

      if (response.status === 429) {
        onProgress("Rate limit hit. Waiting 15s...");
        await new Promise((res) => setTimeout(res, 15000));

        response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: publicUrl }),
        });

        responseData = await response.json();
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to convert image");
      }

      if (
        !responseData.output ||
        !Array.isArray(responseData.output) ||
        !responseData.output[0]
      ) {
        throw new Error("Invalid response from conversion service");
      }

      const convertedUrl = responseData.output[0];
      onImageConverted(publicUrl, convertedUrl);
      resetUpload();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while processing your image";

      console.error("❌ Error in handleFileUpload:", errorMessage);
      setError(errorMessage);
      onError(errorMessage);
      resetUpload();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isConverting
            ? "border-white-400"
            : "border-white-300 hover:border-white-400"
        } transition-colors`}
      >
        <input
          key={key}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isConverting}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer inline-flex flex-col items-center w-full ${
            isConverting ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <div className="mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-medium mb-4">
              Click to upload an image
            </span>
            <div className="text-sm text-gray-400 space-y-3 max-w-sm mx-auto px-8">
              <p>Supports: JPG, PNG (max 4MB)</p>
              <p>Recommended size: 800×400px</p>
            </div>
          </div>
        </label>

        {error && (
          <div className="mt-4 text-sm text-red-500 bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
