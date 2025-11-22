import type { FC } from 'react';

export interface Subject {
  name: string;
  code: string;
  category: string;
}

export interface SubjectMarks {
  subjectName: string;
  theoryMidSem: number;
  theoryQuiz: number;
  theoryEndSem: number;
  practicalEndSem: number;
  practicalLabWork: number;
  grade?: string; // Added grade field
  reExam?: {
    theoryEndSem?: number;
    practicalEndSem?: number;
  }
}

export type SemesterMarks = SubjectMarks[];

export interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  marks: SemesterMarks;
  totalMarks: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  sgpa?: number;
  cgpa?: number;
}

export interface LibraryRecord {
  id: string;
  bookName: string;
  bookCode: string;
  issueDate: string;
  returnDate?: string;
  isReturned: boolean;
}

// This represents the full, detailed profile for a student, including historical and personal data.
export interface FullStudentProfile extends Student {
  academicHistory: Record<number, SemesterMarks | null>; // Sem 1 to 8
  manualAggregates?: Record<number, { sgpa?: number; cgpa?: number }>; // Store manual overrides per semester
  sessionData?: Record<number, string>; // Store session info per semester
  sports: string[];
  extracurricular: string[];
  accounts: {
    collegeFeeDue: boolean;
    isHostelResident: boolean;
    hostelFeeDue: boolean;
  };
  library: LibraryRecord[];
}


export interface PerformanceData {
  averagePercentage: number;
  passPercentage: number;
  students: FullStudentProfile[]; // Use the new extended profile
}

export interface Department {
  id: string;
  name: string;
  icon: FC;
  colorClasses: {
    bg: string;
    text: string;
    ring: string;
  };
}

export interface YearData {
  year: number;
  semesters: number[];
}