"use client";

import { useState, useRef, useCallback } from "react";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setError(null);
    setResultImage(null);
    setProcessingProgress(0);

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Send to API
    setIsLoading(true);
    setProcessingProgress(10);

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 5, 80));
      }, 500);

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(90);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to process image");
      }

      const data = await response.json();
      setProcessingProgress(100);
      setResultImage(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "removed-background.png";
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    setProcessingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Image Background Remover
          </h1>
          <p className="text-gray-400 text-lg">
            Upload an image to remove its background instantly
          </p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-3xl p-8">
          {!originalImage ? (
            /* Upload Zone */
            <div
              className={`drop-zone rounded-2xl p-12 text-center cursor-pointer ${isDragOver ? "drag-over" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              style={{ cursor: 'pointer' }}
            >
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-xl text-gray-300 mb-2">
                  Drag & drop your image here
                </p>
                <p className="text-gray-500">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <p className="text-sm text-gray-600 mt-4">
                Supports PNG, JPG, WEBP
              </p>
            </div>
          ) : (
            /* Preview Zone */
            <div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Original */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 uppercase tracking-wide">
                    Original
                  </p>
                  <div className="relative rounded-2xl overflow-hidden bg-black/30">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Result */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 uppercase tracking-wide">
                    Result
                  </p>
                  <div className="relative rounded-2xl overflow-hidden bg-black/30 min-h-[200px] flex items-center justify-center">
                    {isLoading ? (
                      <div className="text-center py-12 w-full">
                        {/* Progress Bar */}
                        <div className="w-full max-w-[200px] mx-auto mb-6">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                        </div>
                        <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                        <p className="text-gray-400 animate-pulse-slow">
                          {processingProgress < 50 ? "Uploading image..." : 
                           processingProgress < 80 ? "Removing background..." : 
                           "Finalizing..."}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          This may take a few seconds
                        </p>
                      </div>
                    ) : resultImage ? (
                      <img
                        src={resultImage}
                        alt="Result"
                        className="w-full h-auto"
                      />
                    ) : error ? (
                      <div className="text-center py-12 px-4">
                        <p className="text-red-400 mb-2">⚠️ {error}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {resultImage && (
                  <button
                    onClick={handleDownload}
                    className="btn-primary px-8 py-3 rounded-xl font-semibold text-white"
                  >
                    📥 Download PNG
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="px-8 py-3 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  🔄 Try Another
                </button>
              </div>
            </div>
          )}

          {error && originalImage && !isLoading && (
            <p className="text-red-400 text-center mt-4">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Powered by Remove.bg API
        </p>
      </div>
    </main>
  );
}
