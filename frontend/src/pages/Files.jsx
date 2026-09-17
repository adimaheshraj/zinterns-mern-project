import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Folder, FileText, Upload, Plus, ChevronRight, CornerDownRight, MoreVertical } from 'lucide-react';

export default function Files() {
  const { token, API_URL } = useApp();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filesList, setFilesList] = useState([]);
  const [folders, setFolders] = useState([]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFilesList(data);
        const folderCounts = data.reduce((counts, file) => {
          const folderPath = file.path || 'General';
          counts[folderPath] = (counts[folderPath] || 0) + 1;
          return counts;
        }, {});
        const updatedFolders = Object.entries(folderCounts).map(([pathKey, count]) => ({
          id: pathKey,
          name: pathKey,
          pathKey,
          count
        }));
        setFolders(updatedFolders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token, API_URL]);

  const handleUploadSimulate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const activeFolderObj = folders.find(f => f.id === selectedFolder);
    const extension = file.name.split('.').pop().toUpperCase();

    try {
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: file.name,
          path: activeFolderObj?.pathKey || 'General',
          size: file.size,
          type: extension
        })
      });
      if (res.ok) {
        await fetchFiles();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const getActivePathKey = () => {
    const folder = folders.find(f => f.id === selectedFolder);
    return folder ? folder.pathKey : null;
  };

  const currentFiles = selectedFolder
    ? filesList.filter(f => f.path === getActivePathKey())
    : filesList;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Folder className="w-7 h-7 text-indigo-500" />
            File explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">Version-controlled repository for learning materials.</p>
        </div>

        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow transition-colors">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
          <input type="file" onChange={handleUploadSimulate} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Folders grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {folders.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelectedFolder(selectedFolder === f.id ? null : f.id)}
            className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all flex items-center justify-between ${
              selectedFolder === f.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'glass-card bg-white dark:bg-slate-900/60 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className={`w-8 h-8 ${selectedFolder === f.id ? 'text-white' : 'text-indigo-500'}`} />
              <div>
                <h4 className="font-bold text-sm">{f.name}</h4>
                <p className={`text-[10px] ${selectedFolder === f.id ? 'text-indigo-200' : 'text-slate-400'} mt-0.5`}>
                  {f.count} documents
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-75" />
          </div>
        ))}
      </div>

      {/* Files List */}
      <div className="p-6 rounded-2xl glass-card border shadow-sm bg-white dark:bg-slate-900/60 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          {selectedFolder ? (
            <>
              <CornerDownRight className="w-4 h-4 text-indigo-500" />
              <span>Files in {folders.find(f => f.id === selectedFolder)?.name}</span>
            </>
          ) : (
            <span>All Documents Repository</span>
          )}
        </h3>

        {uploading && (
          <div className="p-4 border bg-indigo-50/10 dark:bg-indigo-950/20 border-indigo-200/20 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
              📤 Uploading and scanning files list...
            </span>
            <div className="w-16 h-1 bg-slate-200 rounded overflow-hidden">
              <div className="h-full bg-indigo-600 animate-bounce"></div>
            </div>
          </div>
        )}

        <div className="divide-y dark:divide-slate-800">
          {currentFiles.length > 0 ? (
            currentFiles.map((file) => (
              <div key={file._id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{file.name}</h5>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                      <span>Size: {formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>Type: {file.type}</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg hover:bg-indigo-100"
                  >
                    Open Link
                  </a>
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No documents in this folder.</p>
          )}
        </div>
      </div>
    </div>
  );
}
