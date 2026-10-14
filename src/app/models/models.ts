export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topicCount: number;
  progress: number; // 0 - 100
}

export interface StudyTask {
  id: string;
  title: string;
  subjectId: string;
  type: "quiz" | "activity" | "session";
  date: string; // ISO date, yyyy-mm-dd
  startTime: string; // '09:00 AM'
  endTime?: string;
  done: boolean;
  description?: string;
}

export interface Material {
  id: string;
  name: string;
  subjectId: string;
  kind: "pdf" | "image" | "doc" | "link";
  size: string;
  addedOn: string;
  url?: string;
}

export interface FocusSession {
  id: string;
  date: string; // ISO date, yyyy-mm-dd
  seconds: number;
  subjectId?: string; // missing on sessions saved before subjects were linked
}

export interface UserProfile {
  name: string;
  email: string;
  avatarInitials: string;
  studyGoal: string;
  school: string;
}