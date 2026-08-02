import { EventModel } from './event.model';

export type ProfileRole = 'user' | 'organizer' | 'approver' | 'admin';

export interface ProfileUser {
  name: string;
  email: string;
  avatar: string;
  roles: ProfileRole[];
}

export interface ProfileMetric {
  value: string;
  label: string;
}

export interface ProfileMenuAction {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  danger?: boolean;
  action?: () => void;
}

export interface ApprovalDocument {
  id?: string;
  name: string;
  filePath?: string | null;
  fileName?: string;
  status: 'uploaded' | 'missing';
}

export interface ApprovalRequest {
  id: string;
  event: EventModel;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  missingDocuments: number;
  documents: ApprovalDocument[];
}

export interface EventApproval {
  id: string;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  reviewerComment: string | null;
  documents: ApprovalDocument[];
}
