import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  LoaderCircle,
  Search,
  Upload,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getErrorMessage(data, fallback) {
  return typeof data?.error === 'string' ? data.error : fallback;
}

function getFileIcon(file) {
  if (file.type?.startsWith('image/')) return FileImage;
  if (file.type?.startsWith('text/') || /pdf|document|word|sheet|presentation/i.test(file.type || '')) return FileText;
  return File;
}

export default function Files() {
  const { token, API_URL } = useApp();
  const inputRef = useRef(null);
  const [filesList, setFilesList] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchFiles = useCallback(async (signal) => {
    const response = await fetch(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Unable to load files. Please try again.'));
    }
    if (!Array.isArray(data)) {
      throw new Error('The file service returned an unexpected response.');
    }
    setFilesList(data);
  }, [API_URL, token]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchFiles(controller.signal)
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Unable to load files. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [fetchFiles]);

  const folders = useMemo(() => {
    const counts = new Map();
    filesList.forEach((file) => {
      const folderPath = file.path?.trim() || 'General';
      counts.set(folderPath, (counts.get(folderPath) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([path, count]) => ({ path, name: path.split('/').filter(Boolean).pop() || path, count }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [filesList]);

  const visibleFiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return filesList
      .filter((file) => !selectedFolder || (file.path?.trim() || 'General') === selectedFolder)
      .filter((file) => !normalizedSearch || `${file.name} ${file.type} ${file.uploadedBy} ${file.path}`.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filesList, search, selectedFolder]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Files must be 25 MB or smaller.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    const body = new FormData();
    body.append('file', file);
    body.append('path', selectedFolder || 'General');

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Upload failed. Please try again.'));
      }
      await fetchFiles();
      setNotice(`${file.name} was uploaded successfully.`);
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file) => {
    if (!file.storageName) {
      setError('This is an older file entry without an uploaded file. Please upload the file again to download it.');
      return;
    }

    setDownloadingFileId(file._id);
    setError('');
    try {
      const response = await fetch(`${API_URL}/files/${encodeURIComponent(file.storageName)}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Unable to download this file.'));
      }

      const fileUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (openError) {
      setError(openError.message || 'Unable to download this file.');
    } finally {
      setDownloadingFileId('');
    }
  };

  const selectedFolderName = folders.find((folder) => folder.path === selectedFolder)?.name;
  const totalSize = filesList.reduce((size, file) => size + (Number(file.size) || 0), 0);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-8" aria-busy={loading || uploading}>
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-100">
              <FolderOpen className="h-4 w-4" />
              Team workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">File explorer</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
              Browse shared documents, keep files organized, and download them securely.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload file'}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              aria-label="Choose a file to upload"
            />
            <p className="mt-2 text-right text-xs text-indigo-100">Maximum file size: 25 MB</p>
          </div>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 sm:max-w-lg">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-indigo-100">Shared files</p>
            <p className="mt-1 text-2xl font-bold">{filesList.length}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-indigo-100">Storage used</p>
            <p className="mt-1 text-2xl font-bold">{formatBytes(totalSize)}</p>
          </div>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <section aria-label="Folders" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Folders</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a folder to narrow the file list.</p>
          </div>
          {selectedFolder && (
            <button type="button" onClick={() => setSelectedFolder('')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
              View all files
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setSelectedFolder('')}
            aria-pressed={!selectedFolder}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              !selectedFolder
                ? 'border-indigo-300 bg-indigo-50 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40'
                : 'border-slate-200 bg-white/80 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
              <HardDrive className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">All files</span>
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{filesList.length} documents</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
          {folders.map((folder) => {
            const active = selectedFolder === folder.path;
            return (
              <button
                type="button"
                key={folder.path}
                onClick={() => setSelectedFolder(active ? '' : folder.path)}
                aria-pressed={active}
                title={folder.path}
                className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-indigo-300 bg-indigo-50 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40'
                    : 'border-slate-200 bg-white/80 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Folder className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{folder.name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{folder.count} documents · {folder.path}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900/70" aria-label="Files">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button type="button" onClick={() => setSelectedFolder('')} className="hover:text-indigo-600 dark:hover:text-indigo-300">Workspace</button>
              {selectedFolderName && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{selectedFolderName}</span>
                </>
              )}
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
              {selectedFolderName || 'All files'}
              <span className="ml-2 text-sm font-medium text-slate-400">{visibleFiles.length}</span>
            </h2>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950/60 dark:focus-within:ring-indigo-900/50 sm:max-w-xs">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files…"
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100"
              aria-label="Search files"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-7 w-7 animate-spin text-indigo-500" />
            Loading your files…
          </div>
        ) : visibleFiles.length ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleFiles.map((file) => {
              const Icon = getFileIcon(file);
              const hasUpload = Boolean(file.storageName);
              return (
                <li key={file._id || `${file.name}-${file.createdAt}`} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={file.name}>{file.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatBytes(Number(file.size) || 0)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{file.type || 'Unknown type'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{file.path || 'General'}</span>
                      {file.createdAt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(file)}
                    disabled={!hasUpload || downloadingFileId === file._id}
                    title={hasUpload ? 'Download file' : 'This older file entry has no uploaded file'}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/60 dark:disabled:border-slate-800 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  >
                    {downloadingFileId === file._id
                      ? <LoaderCircle className="h-4 w-4 animate-spin" />
                      : hasUpload ? <Download className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {hasUpload ? 'Download' : 'Unavailable'}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              {search ? <Search className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">
              {search ? 'No matching files' : selectedFolderName ? 'This folder is empty' : 'No files yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {search ? 'Try another search term or clear the search field.' : 'Upload a document to add it to the shared workspace.'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                Upload a file
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
