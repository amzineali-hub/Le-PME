import React, { useState } from 'react';
import { PartyEvent, Language, Member, EventType } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { MOROCCAN_REGIONS } from '../data/regions';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Bell,
  CheckCircle2,
  CalendarPlus,
  Share2,
  Search,
  Filter,
  X,
  Sparkles,
  ShieldCheck,
  Mail,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface EventsManagerProps {
  events: PartyEvent[];
  currentUser: Member | null;
  lang: Language;
  onRegisterEvent: (eventId: string) => void;
  onUnregisterEvent: (eventId: string) => void;
  onToggleReminder: (eventId: string) => void;
  onCreateEvent: (eventData: Omit<PartyEvent, 'id' | 'registeredMemberIds' | 'reminderSubscribedMemberIds'>) => void;
  onOpenAuthModal: () => void;
}

export const EventsManager: React.FC<EventsManagerProps> = ({
  events,
  currentUser,
  lang,
  onRegisterEvent,
  onUnregisterEvent,
  onToggleReminder,
  onCreateEvent,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [reminderModalEvent, setReminderModalEvent] = useState<PartyEvent | null>(null);

  // New Event Form State
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [type, setType] = useState<EventType>('congress');
  const [date, setDate] = useState('2026-11-20');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [locationType, setLocationType] = useState<PartyEvent['locationType']>('in_person');
  const [locationAddressFr, setLocationAddressFr] = useState('');
  const [locationAddressAr, setLocationAddressAr] = useState('');
  const [regionId, setRegionId] = useState('rabat-sale-kenitra');
  const [capacity, setCapacity] = useState<number>(200);
  const [descriptionFr, setDescriptionFr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState('');

  const isAdmin = currentUser?.role === 'bureau_politique' || currentUser?.role === 'admin';

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (selectedType !== 'all' && ev.type !== selectedType) return false;
    if (selectedRegion !== 'all' && ev.regionId !== selectedRegion) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchFr = ev.titleFr.toLowerCase().includes(q) || ev.descriptionFr.toLowerCase().includes(q);
      const matchAr = ev.titleAr.includes(q) || ev.descriptionAr.includes(q);
      if (!matchFr && !matchAr) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFr.trim()) return;

    onCreateEvent({
      titleFr: titleFr.trim(),
      titleAr: titleAr.trim() || titleFr.trim(),
      type,
      date,
      startTime,
      endTime,
      locationType,
      locationAddressFr: locationAddressFr.trim(),
      locationAddressAr: locationAddressAr.trim() || locationAddressFr.trim(),
      regionId,
      capacity: Number(capacity) || 100,
      descriptionFr: descriptionFr.trim(),
      descriptionAr: descriptionAr.trim() || descriptionFr.trim(),
      speakerName: speakerName.trim() || undefined,
      speakerRole: speakerRole.trim() || undefined,
      onlineMeetingUrl: onlineMeetingUrl.trim() || undefined,
    });

    // Reset
    setTitleFr('');
    setTitleAr('');
    setDescriptionFr('');
    setDescriptionAr('');
    setLocationAddressFr('');
    setLocationAddressAr('');
    setShowCreateModal(false);
  };

  // Generate downloadable .ics calendar file
  const downloadIcsFile = (event: PartyEvent) => {
    const cleanDate = event.date.replace(/-/g, '');
    const cleanStart = event.startTime.replace(/:/g, '') + '00';
    const cleanEnd = event.endTime.replace(/:/g, '') + '00';

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Parti du Maroc Emergeant//Agenda Officiel//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:pme-evt-${event.id}@parti-maroc-emergeant.ma`,
      `DTSTART:${cleanDate}T${cleanStart}`,
      `DTEND:${cleanDate}T${cleanEnd}`,
      `SUMMARY:${event.titleFr}`,
      `DESCRIPTION:${event.descriptionFr.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.locationAddressFr}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PME_Event_${event.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            {t.events.tagline}
          </span>
          <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.events.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t.events.subtitle}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.events.createEventBtn}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'البحث عن موعد أو مؤتمر أو ندوة...' : 'Rechercher un événement, ville ou mot-clé...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Region filter */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full sm:w-56 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">{t.regions.filterAll}</option>
              {MOROCCAN_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {isAr ? r.nameAr : r.nameFr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Event Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {[
            { id: 'all', label: t.events.filterAll },
            { id: 'congress', label: t.events.types.congress },
            { id: 'webinar', label: t.events.types.webinar },
            { id: 'regional_meeting', label: t.events.types.regional_meeting },
            { id: 'workshop', label: t.events.types.workshop },
            { id: 'citizen_caravan', label: t.events.types.citizen_caravan },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === item.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((ev) => {
          const isRegistered = Boolean(currentUser && ev.registeredMemberIds.includes(currentUser.id));
          const hasReminder = Boolean(currentUser && ev.reminderSubscribedMemberIds.includes(currentUser.id));
          const seatsTaken = ev.registeredMemberIds.length;
          const seatsAvailable = Math.max(0, ev.capacity - seatsTaken);
          const isFull = seatsAvailable === 0 && !isRegistered;

          const region = MOROCCAN_REGIONS.find((r) => r.id === ev.regionId);

          return (
            <div
              key={ev.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t.events.types[ev.type]}
                    </span>

                    {ev.locationType === 'online' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>En ligne</span>
                      </span>
                    )}

                    {ev.locationType === 'hybrid' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Hybride
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{ev.date}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                  {isAr ? ev.titleAr : ev.titleFr}
                </h3>

                {/* Time & Place Meta */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-mono">
                      {ev.startTime} - {ev.endTime}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="truncate">
                      {isAr ? ev.locationAddressAr : ev.locationAddressFr}
                      {region ? ` (${isAr ? region.nameAr : region.nameFr})` : ''}
                    </span>
                  </div>

                  {ev.speakerName && (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                      <span>Intervenant : {ev.speakerName}</span>
                      {ev.speakerRole && <span className="text-slate-400">• {ev.speakerRole}</span>}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {isAr ? ev.descriptionAr : ev.descriptionFr}
                </p>
              </div>

              {/* Bottom Actions & Capacity */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {seatsTaken} inscrits •{' '}
                      <span className={seatsAvailable < 20 ? 'text-amber-700 font-bold' : 'font-medium'}>
                        {isFull ? t.events.fullCapacity : `${seatsAvailable} ${t.events.placesLeft}`}
                      </span>
                    </span>
                  </div>

                  {isRegistered && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                      {t.events.registeredBadge}
                    </span>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Register or Unregister */}
                  {currentUser ? (
                    isRegistered ? (
                      <button
                        onClick={() => onUnregisterEvent(ev.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        {t.events.cancelRegisterBtn}
                      </button>
                    ) : (
                      <button
                        onClick={() => onRegisterEvent(ev.id)}
                        disabled={isFull}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white shadow-xs transition-all active:scale-95 text-center"
                      >
                        {t.events.registerBtn}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={onOpenAuthModal}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs text-center"
                    >
                      Connexion pour s’inscrire
                    </button>
                  )}

                  {/* Reminder Toggle (Email & Push) */}
                  {currentUser && (
                    <button
                      onClick={() => {
                        onToggleReminder(ev.id);
                        if (!hasReminder) setReminderModalEvent(ev);
                      }}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        hasReminder
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title={hasReminder ? t.events.reminderSubscribed : t.events.reminderBtn}
                    >
                      <Bell className={`w-4 h-4 ${hasReminder ? 'fill-amber-500 text-amber-600' : ''}`} />
                    </button>
                  )}

                  {/* Calendar .ics Download */}
                  <button
                    onClick={() => downloadIcsFile(ev)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    title={t.events.downloadIcs}
                  >
                    <CalendarPlus className="w-4 h-4 text-emerald-700" />
                  </button>

                  {/* Direct link for online meetings */}
                  {ev.onlineMeetingUrl && (
                    <a
                      href={ev.onlineMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      title={t.events.openVisio}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reminder Notification Simulator Modal */}
      {reminderModalEvent && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Bell className="w-7 h-7 text-amber-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900">
                {t.events.reminderSimulator.title}
              </h3>
              <p className="text-xs text-slate-500">
                {t.events.reminderSimulator.subtitle}
              </p>
              <div className="font-bold text-slate-900 text-sm mt-1">
                {isAr ? reminderModalEvent.titleAr : reminderModalEvent.titleFr}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-left space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-700" />
                <span>
                  {t.events.reminderSimulator.emailDest}{' '}
                  <span className="font-mono font-bold text-slate-800">{currentUser.email}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.events.reminderSimulator.pushStatus}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarPlus className="w-4 h-4 text-emerald-700" />
                <span>{t.events.reminderSimulator.calendarReady}</span>
              </div>
            </div>

            <button
              onClick={() => setReminderModalEvent(null)}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
            >
              {t.events.reminderSimulator.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Admin Modal: Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Administration Centrale
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {t.events.modal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.events.modal.desc}</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Titles FR & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldTitleFr}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleFr}
                    onChange={(e) => setTitleFr(e.target.value)}
                    placeholder="Ex: Congrès Régional..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>

                <div dir="rtl">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.events.modal.fieldTitleAr}
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: المؤتمر الجهوي..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 outline-none font-arabic text-right"
                  />
                </div>
              </div>

              {/* Type, Date, Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldType}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="congress">{t.events.types.congress}</option>
                    <option value="webinar">{t.events.types.webinar}</option>
                    <option value="regional_meeting">{t.events.types.regional_meeting}</option>
                    <option value="workshop">{t.events.types.workshop}</option>
                    <option value="citizen_caravan">{t.events.types.citizen_caravan}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldStartTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldEndTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Location Type, Region & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldLocationType}
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="in_person">Présentiel</option>
                    <option value="online">En ligne (Visioconférence)</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldRegion}
                  </label>
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    {MOROCCAN_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {isAr ? r.nameAr : r.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldCapacity}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Physical Location Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldLocationFr}
                  </label>
                  <input
                    type="text"
                    required
                    value={locationAddressFr}
                    onChange={(e) => setLocationAddressFr(e.target.value)}
                    placeholder="Palais des Congrès, Salle Polyvalente..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>

                <div dir="rtl">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.events.modal.fieldLocationAr}
                  </label>
                  <input
                    type="text"
                    value={locationAddressAr}
                    onChange={(e) => setLocationAddressAr(e.target.value)}
                    placeholder="قصر المؤتمرات، القاعة الكبرى..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none font-arabic text-right"
                  />
                </div>
              </div>

              {/* Speaker info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldSpeakerName}
                  </label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder="Ex: Ali Amzine"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldSpeakerRole}
                  </label>
                  <input
                    type="text"
                    value={speakerRole}
                    onChange={(e) => setSpeakerRole(e.target.value)}
                    placeholder="Ex: Secrétaire Général"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Online url */}
              {locationType !== 'in_person' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.events.modal.fieldVisioUrl}
                  </label>
                  <input
                    type="url"
                    value={onlineMeetingUrl}
                    onChange={(e) => setOnlineMeetingUrl(e.target.value)}
                    placeholder="https://visio.parti-maroc-emergeant.ma/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none font-mono"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.events.modal.fieldDescFr}
                </label>
                <textarea
                  rows={3}
                  required
                  value={descriptionFr}
                  onChange={(e) => setDescriptionFr(e.target.value)}
                  placeholder="Ordre du jour, objectifs et déroulé de l'événement..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.events.modal.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95 transition-all"
                >
                  {t.events.modal.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
