export type Language = 'fr' | 'ar';

export interface MoroccanRegion {
  id: string;
  code: string;
  nameFr: string;
  nameAr: string;
  capitalFr: string;
  capitalAr: string;
  provincesFr: string[];
  provincesAr: string[];
  coordinatorName: string;
  coordinatorEmail: string;
  membersCount: number;
  descriptionFr: string;
  descriptionAr: string;
}

export interface ElectoralVerificationResult {
  cin: string;
  isRegistered: boolean;
  registrationNumber: string;
  electoralBureauFr: string;
  electoralBureauAr: string;
  communeFr: string;
  communeAr: string;
  verifiedAt: string;
  source: string;
}

export type ElectoralStatus = 'none' | 'submitted' | 'verified' | 'rejected';

export interface Member {
  id: string;
  membershipNumber: string; // e.g. PME-2026-RSK-0842
  firstNameFr: string;
  lastNameFr: string;
  firstNameAr: string;
  lastNameAr: string;
  cin: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F';
  regionId: string;
  province: string;
  commune: string;
  profession: string;
  photoUrl: string;
  role: 'member' | 'regional_coordinator' | 'bureau_politique' | 'admin';
  commissionInterest: string;
  status: 'active' | 'pending_verification' | 'honorary';
  joinedDate: string;
  validUntil: string;
  isElectorallyVerified: boolean;
  isEmailVerified: boolean;
  electoralStatus?: ElectoralStatus;
  electoralProofName?: string;
  electoralDetails?: ElectoralVerificationResult;
  contributionBadge: string;
  contributionBadgeAr?: string;
}

export interface DebateTopic {
  id: string;
  category: 'economy' | 'health_social' | 'education_youth' | 'water_ecology' | 'governance' | 'regional_development';
  titleFr: string;
  titleAr: string;
  authorName: string;
  authorRegion: string;
  authorRole: string;
  createdAt: string;
  contentFr: string;
  contentAr: string;
  votesFor: number;
  votesAgainst: number;
  votesNeutral: number;
  userVote?: 'for' | 'against' | 'neutral';
  commentsCount: number;
  status: 'open' | 'under_review' | 'adopted_in_program';
  tags: string[];
}

export interface DebateComment {
  id: string;
  debateId: string;
  authorName: string;
  authorRegion: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

export interface PollOption {
  id: string;
  textFr: string;
  textAr: string;
  votes: number;
}

export interface CitizenPoll {
  id: string;
  questionFr: string;
  questionAr: string;
  descriptionFr: string;
  descriptionAr: string;
  categoryFr: string;
  categoryAr: string;
  deadline: string;
  status: 'open' | 'closed';
  type: 'consultation' | 'referendum' | 'internal_election';
  totalVotes: number;
  options: PollOption[];
  votedUserIds: string[]; // Strict tracking to allow only 1 vote per member
  userVotedOptionId?: string;
  createdBy?: string;
  createdAt?: string;
}

export type EventType = 'congress' | 'webinar' | 'regional_meeting' | 'workshop' | 'citizen_caravan';

export interface PartyEvent {
  id: string;
  titleFr: string;
  titleAr: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  locationType: 'in_person' | 'online' | 'hybrid';
  locationAddressFr: string;
  locationAddressAr: string;
  regionId?: string;
  descriptionFr: string;
  descriptionAr: string;
  capacity: number;
  registeredMemberIds: string[];
  reminderSubscribedMemberIds: string[]; // Members who asked for email/push notification
  isOfficialMandatory?: boolean;
  speakerName?: string;
  speakerRole?: string;
  onlineMeetingUrl?: string;
}

export type DocumentCategory =
  | 'legal_statutes'
  | 'manifestos'
  | 'circulars'
  | 'militant_guides'
  | 'economic_reports'
  | 'press_releases';

export type FileFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx';

export interface PartyDocument {
  id: string;
  titleFr: string;
  titleAr: string;
  category: DocumentCategory;
  fileFormat: FileFormat;
  date: string;
  fileSize: string;
  downloadUrl: string;
  descriptionFr: string;
  descriptionAr: string;
  accessLevel: 'public' | 'members_only' | 'executives_only';
  downloadsCount: number;
  uploadedBy?: string;
}

export interface NewsArticle {
  id: string;
  titleFr: string;
  titleAr: string;
  excerptFr: string;
  excerptAr: string;
  contentFr: string;
  contentAr: string;
  date: string;
  categoryFr: string;
  categoryAr: string;
  readTimeFr: string;
  readTimeAr: string;
  imageUrl: string;
  isOfficialStatement?: boolean;
}
