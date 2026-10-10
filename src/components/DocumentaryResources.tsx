import React, { useState } from 'react';
import { PartyDocument, Language, Member, DocumentCategory, FileFormat } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  Lock,
  Globe,
  Users,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock
} from 'lucide-react';

interface DocumentaryResourcesProps {
  documents: PartyDocument[];
  currentUser: Member | null;
  lang: Language;
  onUploadDocument: (docData: Omit<PartyDocument, 'id' | 'downloadsCount'>) => void;
  onDownloadDocument: (docId: string) => void;
  onOpenAuthModal: () => void;
}

export const DocumentaryResources: React.FC<DocumentaryResourcesProps> = ({
  documents,
  currentUser,
  lang,
  onUploadDocument,
  onDownloadDocument,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'downloads' | 'title'>('recent');
  const [previewDoc, setPreviewDoc] = useState<PartyDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // New Document Upload State
  const [newTitleFr, setNewTitleFr] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('manifestos');
  const [newFormat, setNewFormat] = useState<FileFormat>('pdf');
  const [newFileSize, setNewFileSize] = useState('2.1 Mo');
  const [newAccessLevel, setNewAccessLevel] = useState<PartyDocument['accessLevel']>('members_only');
  const [newDescFr, setNewDescFr] = useState('');
  const [newDescAr, setNewDescAr] = useState('');

  const isAdmin = currentUser?.role === 'bureau_politique' || currentUser?.role === 'admin';

  // Filter & Search
  const filtered = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (selectedFormat !== 'all' && doc.fileFormat !== selectedFormat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchFr = doc.titleFr.toLowerCase().includes(q) || doc.descriptionFr.toLowerCase().includes(q);
      const matchAr = doc.titleAr.includes(q) || doc.descriptionAr.includes(q);
      if (!matchFr && !matchAr) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'downloads') {
      return b.downloadsCount - a.downloadsCount;
    }
    if (sortBy === 'title') {
      return a.titleFr.localeCompare(b.titleFr);
    }
    return 0;
  });

  const getFormatIcon = (format: FileFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'docx':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'pptx':
        return <FileText className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getFormatBadgeStyle = (format: FileFormat) => {
    switch (format) {
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'docx':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'xlsx':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pptx':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Perform actual simulated document file download
  const handleDownload = (doc: PartyDocument) => {
    onDownloadDocument(doc.id);

    // Create an official text file with letterhead representation
    const content = [
      '=================================================================',
      'ROYAUME DU MAROC - PARTI DU MAROC ÉMERGEANT (PME)',
      'المملكة المغربية - حزب المغرب الصاعد',
      '=================================================================',
      '',
      `TITRE DU DOCUMENT : ${doc.titleFr}`,
      `الوثيقة : ${doc.titleAr}`,
      `CATÉGORIE : ${t.resources.categories[doc.category] || doc.category}`,
      `FORMAT OFFICIEL : ${doc.fileFormat.toUpperCase()}`,
      `DATE DE PUBLICATION : ${doc.date}`,
      `NIVEAU D'ACCÈS : ${t.resources.accessLevels[doc.accessLevel]}`,
      `DIFFUSION : ${doc.uploadedBy || 'Direction Centrale PME'}`,
      '',
      '--- RÉSUMÉ DU DOCUMENT ---',
      doc.descriptionFr,
      '',
      '--- بيان المحتوى ---',
      doc.descriptionAr,
      '',
      '=================================================================',
      'DOCUMENT OFFICIEL CERTIFIÉ CONFORME PAR LE BUREAU POLITIQUE DU PME',
      `TÉLÉCHARGÉ PAR : ${currentUser ? `${currentUser.firstNameFr} ${currentUser.lastNameFr} (${currentUser.membershipNumber})` : 'Visiteur Civique'}`,
      `DATE D'EXTRACTION : ${new Date().toISOString()}`,
      '=================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PME_${doc.category}_${doc.id}.${doc.fileFormat === 'pdf' ? 'txt' : doc.fileFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleFr.trim()) return;

    onUploadDocument({
      titleFr: newTitleFr.trim(),
      titleAr: newTitleAr.trim() || newTitleFr.trim(),
      category: newCategory,
      fileFormat: newFormat,
      fileSize: newFileSize.trim() || '1.5 Mo',
      downloadUrl: '#',
      descriptionFr: newDescFr.trim(),
      descriptionAr: newDescAr.trim() || newDescFr.trim(),
      accessLevel: newAccessLevel,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser ? `${currentUser.firstNameFr} ${currentUser.lastNameFr}` : 'Bureau Politique',
    });

    setNewTitleFr('');
    setNewTitleAr('');
    setNewDescFr('');
    setNewDescAr('');
    setShowUploadModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            {t.resources.tagline}
          </span>
          <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.resources.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.resources.subtitle}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.resources.uploadBtn}</span>
          </button>
        )}
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.resources.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="flex-1 min-w-0 sm:flex-none py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">{t.resources.filterFormat}</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pptx">PowerPoint (.pptx)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 min-w-0 sm:flex-none py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
            >
              <option value="recent">{t.resources.sortRecent}</option>
              <option value="downloads">{t.resources.sortDownloads}</option>
              <option value="title">{t.resources.sortTitle}</option>
            </select>
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {[
            { id: 'all', label: t.resources.categories.all },
            { id: 'legal_statutes', label: t.resources.categories.legal_statutes },
            { id: 'manifestos', label: t.resources.categories.manifestos },
            { id: 'circulars', label: t.resources.categories.circulars },
            { id: 'militant_guides', label: t.resources.categories.militant_guides },
            { id: 'economic_reports', label: t.resources.categories.economic_reports },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sorted.map((doc) => {
          const isRestricted =
            doc.accessLevel !== 'public' && !currentUser;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Format Badge + Access Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase border flex items-center gap-1.5 ${getFormatBadgeStyle(
                        doc.fileFormat
                      )}`}
                    >
                      {getFormatIcon(doc.fileFormat)}
                      <span>{doc.fileFormat}</span>
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {doc.fileSize}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      doc.accessLevel === 'public'
                        ? 'bg-emerald-50 text-emerald-800'
                        : doc.accessLevel === 'executives_only'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {doc.accessLevel === 'public' ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    <span>{t.resources.accessLevels[doc.accessLevel]}</span>
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {isAr ? doc.titleAr : doc.titleFr}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>{doc.date}</span>
                    <span>•</span>
                    <span className="font-medium text-emerald-700">
                      {t.resources.categories[doc.category] || doc.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {isAr ? doc.descriptionAr : doc.descriptionFr}
                </p>
              </div>

              {/* Bottom: Downloads count + Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {doc.downloadsCount.toLocaleString()} {t.resources.downloadsCount}
                </span>

                <div className="flex items-center gap-2">
                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title={t.resources.previewBtn}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Download Button */}
                  {isRestricted ? (
                    <button
                      onClick={onOpenAuthModal}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Connexion requise</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.resources.downloadBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Stamped Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {previewDoc.fileFormat} • {previewDoc.fileSize}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {isAr ? previewDoc.titleAr : previewDoc.titleFr}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Letterhead View */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700 leading-relaxed font-serif">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between font-sans">
                <span className="font-bold text-emerald-900">المملكة المغربية • حزب المغرب الصاعد</span>
                <span className="text-slate-400">{previewDoc.date}</span>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-sm text-slate-900">
                  {previewDoc.titleFr}
                </div>
                <p>{previewDoc.descriptionFr}</p>
                {previewDoc.descriptionAr && (
                  <p className="font-arabic text-right text-slate-800 pt-2 border-t border-slate-200">
                    {previewDoc.descriptionAr}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between font-sans text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sceau Officiel du Secrétariat Général</span>
                </span>
                <span className="font-mono">PME-DOC-{previewDoc.id}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{t.resources.downloadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal: Upload / Register Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Administration Médiathèque
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {t.resources.modal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.resources.modal.desc}</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.resources.modal.fieldTitleFr}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleFr}
                  onChange={(e) => setNewTitleFr(e.target.value)}
                  placeholder="Ex: Rapport Stratégique 2026..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                />
              </div>

              <div dir="rtl">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.resources.modal.fieldTitleAr}
                </label>
                <input
                  type="text"
                  value={newTitleAr}
                  onChange={(e) => setNewTitleAr(e.target.value)}
                  placeholder="مثال: التقرير الاستراتيجي 2026..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none font-arabic text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.resources.modal.fieldCategory}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="legal_statutes">Textes & Statuts</option>
                    <option value="manifestos">Programmes & Manifestes</option>
                    <option value="circulars">Circulaires</option>
                    <option value="militant_guides">Guides Militants</option>
                    <option value="economic_reports">Études Économiques</option>
                    <option value="press_releases">Communiqués</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.resources.modal.fieldFormat}
                  </label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none uppercase font-mono"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">DOCX (.docx)</option>
                    <option value="xlsx">XLSX (.xlsx)</option>
                    <option value="pptx">PPTX (.pptx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.resources.modal.fieldAccessLevel}
                  </label>
                  <select
                    value={newAccessLevel}
                    onChange={(e) => setNewAccessLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="public">Accès Public</option>
                    <option value="members_only">Réservé aux Membres</option>
                    <option value="executives_only">Bureau Politique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.resources.modal.fieldFileSize}
                </label>
                <input
                  type="text"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(e.target.value)}
                  placeholder="2.5 Mo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.resources.modal.fieldDescFr}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescFr}
                  onChange={(e) => setNewDescFr(e.target.value)}
                  placeholder="Décrivez l'objet de ce document..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.resources.modal.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95 transition-all"
                >
                  {t.resources.modal.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
