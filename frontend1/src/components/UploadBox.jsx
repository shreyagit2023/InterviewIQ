import { useRef, useState } from "react";

export default function UploadBox({ onUpload }) {
  const inputRef = useRef();

  const [fileName, setFileName] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFileName(file.name);

    onUpload(file);
  };

  return (
    <div className="upload-container">

      <div className="upload-card">

        <h2>Upload your PDF</h2>

        <p>
          Upload your resume, notes or interview material.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={handleFile}
        />

        <button
          className="upload-btn"
          onClick={() => inputRef.current.click()}
        >
          Choose PDF
        </button>

        {fileName && (
          <div className="uploaded-file">
            {fileName}
          </div>
        )}

      </div>

    </div>
  );
}