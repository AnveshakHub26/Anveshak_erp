'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { FileUploadZone } from './file-upload-zone';
import { Button } from '@/components/ui/button';
import {
  Folder,
  FolderPlus,
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Home,
  Trash2,
  Edit2,
  FolderInput,
  Search,
  Plus,
  Loader2,
  ArrowLeft,
  X,
  FileIcon,
} from 'lucide-react';

export interface DocumentBrowserProps {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  className?: string;
}

export function DocumentBrowser({
  entityType,
  entityId,
  entityTitle = 'Entity Workspace',
  className = '',
}: DocumentBrowserProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root Documents' },
  ]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [movingDocId, setMovingDocId] = useState<string | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  // Load Folders & Documents for Entity
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch folders
      const foldersRes = await apiRequest<{ success: boolean; data: any[] }>(
        `/documents/folders/entity/${entityType}/${entityId}`,
      );

      // 2. Fetch documents for current folder scope
      const folderParam = activeFolderId ? `?folderId=${activeFolderId}` : '?folderId=root';
      const docsRes = await apiRequest<{ success: boolean; data: { items: any[] } }>(
        `/documents/entity/${entityType}/${entityId}${folderParam}`,
      );

      if (foldersRes && foldersRes.data) {
        setFolders(foldersRes.data);
      }
      if (docsRes && docsRes.data?.items) {
        setDocuments(docsRes.data.items);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load documents and folders.');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, activeFolderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update Breadcrumbs when activeFolderId changes
  useEffect(() => {
    if (!activeFolderId) {
      setBreadcrumbs([{ id: null, name: 'Root Documents' }]);
      return;
    }

    const currentFolder = folders.find((f) => f.id === activeFolderId);
    if (currentFolder) {
      const chain: { id: string | null; name: string }[] = [{ id: currentFolder.id, name: currentFolder.name }];
      let curr = currentFolder;

      while (curr && curr.parentFolderId) {
        const parent = folders.find((f) => f.id === curr.parentFolderId);
        if (parent) {
          chain.unshift({ id: parent.id, name: parent.name });
          curr = parent;
        } else {
          break;
        }
      }
      chain.unshift({ id: null, name: 'Root' });
      setBreadcrumbs(chain);
    }
  }, [activeFolderId, folders]);

  // Subfolders in current active view
  const currentSubfolders = folders.filter((f) =>
    activeFolderId ? f.parentFolderId === activeFolderId : !f.parentFolderId,
  );

  // Filtered documents & subfolders by search query
  const filteredSubfolders = currentSubfolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.storageKey.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      await apiRequest('/documents/folders', {
        method: 'POST',
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentFolderId: activeFolderId || undefined,
          entityType,
          entityId,
        }),
      });

      setNewFolderName('');
      setShowCreateFolderModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!renameValue.trim()) return;
    try {
      await apiRequest(`/documents/folders/${folderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      setEditingFolderId(null);
      setRenameValue('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to rename folder.');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete folder '${folderName}'? Subfolders will be deleted and documents unassigned.`)) {
      return;
    }

    try {
      await apiRequest(`/documents/folders/${folderId}`, { method: 'DELETE' });
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete folder.');
    }
  };

  const handleMoveDocument = async (docId: string) => {
    try {
      await apiRequest(`/documents/${docId}/folder`, {
        method: 'PATCH',
        body: JSON.stringify({ folderId: targetFolderId || null }),
      });
      setMovingDocId(null);
      setTargetFolderId('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to move document.');
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await apiRequest<{ success: boolean; data: { downloadUrl: string } }>(
        `/documents/${docId}/download-url`,
      );
      if (res && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate signed download link.');
    }
  };

  return (
    <div className={`space-y-4 text-xs font-sans ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <Folder className="h-4 w-4 text-[#d49b38]" />
            {entityTitle} Document Repository
          </h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Centralized polymorphic storage, folder structure, and signed file access
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowCreateFolderModal(true)}>
            <FolderPlus className="h-3.5 w-3.5 mr-1 text-[#d49b38]" /> New Folder
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Upload File
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1 overflow-x-auto text-[11px] font-medium">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id || 'root'}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
              <button
                onClick={() => setActiveFolderId(b.id)}
                className={`hover:text-[#d49b38] transition-colors shrink-0 ${
                  activeFolderId === b.id ? 'font-bold text-[#0F172A]' : 'text-[#64748B]'
                }`}
              >
                {b.id === null ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3 text-[#d49b38]" /> Root
                  </span>
                ) : (
                  b.name
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search files or folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
          />
        </div>
      </div>

      {/* Upload Modal Drawer */}
      {showUploadModal && (
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-[#0F172A]">
              Upload to {activeFolderId ? `Folder '${breadcrumbs[breadcrumbs.length - 1]?.name}'` : 'Root'}
            </h3>
            <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <FileUploadZone
            entityType={entityType}
            entityId={entityId}
            onUploadComplete={() => {
              loadData();
              setShowUploadModal(false);
            }}
          />
        </div>
      )}

      {/* Create Folder Modal Drawer */}
      {showCreateFolderModal && (
        <form onSubmit={handleCreateFolder} className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h3 className="font-bold text-[#0F172A]">Create New Folder</h3>
            <button type="button" onClick={() => setShowCreateFolderModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#64748B]">Folder Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Technical Specs, Legal Contracts"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateFolderModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={creatingFolder}>
              Create Folder
            </Button>
          </div>
        </form>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-[#64748B] flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#d49b38]" /> Loading folder contents...
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
          {errorMsg}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subfolders Grid */}
          {filteredSubfolders.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Folders</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSubfolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#d49b38] transition-colors group shadow-2xs"
                  >
                    {editingFolderId === folder.id ? (
                      <div className="flex items-center space-x-2 w-full">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="w-full border border-[#E2E8F0] rounded-md px-2 py-1 text-xs"
                        />
                        <Button size="sm" variant="primary" onClick={() => handleRenameFolder(folder.id)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveFolderId(folder.id)}
                          className="flex items-center space-x-2.5 truncate text-left"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#d49b38] shrink-0 border border-amber-200">
                            <Folder className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <strong className="font-bold text-[#0F172A] block truncate">{folder.name}</strong>
                            <span className="text-[10px] text-[#64748B]">
                              {folder._count?.documents || 0} files · {folder._count?.subFolders || 0} subfolders
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingFolderId(folder.id);
                              setRenameValue(folder.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                            title="Rename Folder"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id, folder.name)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                            title="Delete Folder"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Files</span>
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-xl text-[#64748B]">
                <FileIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-[#0F172A]">No documents found</p>
                <p className="text-[11px]">Upload a document to store it in this folder.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px]">
                        <th className="p-3 font-semibold">Name & Type</th>
                        <th className="p-3 font-semibold">Virus Scan</th>
                        <th className="p-3 font-semibold">Visibility</th>
                        <th className="p-3 font-semibold">Uploader</th>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#151c2e] text-[#d49b38] shrink-0 font-bold">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-[#0F172A] block">{doc.filename}</span>
                                <span className="text-[10px] text-[#64748B]">{doc.type} · v{doc.versions?.[0]?.version || 1}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            {doc.scanStatus === 'CLEAN' ? (
                              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" /> CLEAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <ShieldAlert className="h-3 w-3 mr-1 text-red-600" /> INFECTED
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-medium text-[#0F172A]">{doc.visibility}</td>
                          <td className="p-3 text-[#64748B]">{doc.uploaderEmail}</td>
                          <td className="p-3 text-[#64748B]">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {movingDocId === doc.id ? (
                                <div className="flex items-center space-x-1">
                                  <select
                                    value={targetFolderId}
                                    onChange={(e) => setTargetFolderId(e.target.value)}
                                    className="border border-[#E2E8F0] rounded-md px-1.5 py-1 text-[11px]"
                                  >
                                    <option value="">Root</option>
                                    {folders.map((f) => (
                                      <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                  </select>
                                  <Button size="sm" variant="primary" onClick={() => handleMoveDocument(doc.id)}>
                                    Move
                                  </Button>
                                  <button onClick={() => setMovingDocId(null)} className="p-1 text-slate-400">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setMovingDocId(doc.id);
                                      setTargetFolderId(doc.folderId || '');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                                    title="Move to Folder"
                                  >
                                    <FolderInput className="h-3.5 w-3.5" />
                                  </button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(doc.id)}
                                    disabled={doc.scanStatus !== 'CLEAN'}
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
