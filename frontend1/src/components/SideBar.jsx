import { Plus, Upload, FileText, Settings } from "lucide-react";
import "./SideBar.css";

export default function Sidebar({
  onNewChat,
  uploaded,
  fileName,
  onUploadClick,
}) {
  return (
    <aside className="sidebar">

      <div>

        <div className="logo">
          <h2>InterviewIQ</h2>
        </div>

        <button
          className="new-chat"
          onClick={onNewChat}
        >
          <Plus size={18} />
          New Chat
        </button>

        {uploaded && (
          <div className="document-section">

            <h4>Current Document</h4>

            <div className="document-card">

              <FileText size={18} />

              <span>{fileName}</span>

            </div>

            <button
              className="upload-another"
              onClick={onUploadClick}
            >
              <Upload size={16} />
              Upload Another PDF
            </button>

          </div>
        )}

      </div>

      <div className="settings">

        <Settings size={18} />

        Settings

      </div>

    </aside>
  );
}