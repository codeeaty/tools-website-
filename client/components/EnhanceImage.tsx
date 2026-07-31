'use client';
import { useState } from 'react';

export default function ImageStudio() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/enhance-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      alert("Done! " + data.message);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e:any) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Enhancing..." : "Enhance Image"}
      </button>
    </div>
  );
}