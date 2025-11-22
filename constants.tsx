import React from 'react';
import { Department, YearData } from './types';

export const YEARS: YearData[] = [
  { year: 1, semesters: [1, 2] },
  { year: 2, semesters: [3, 4] },
  { year: 3, semesters: [5, 6] },
  { year: 4, semesters: [7, 8] },
];

const CseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MechIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const EceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5m0 14v-1m6-11l-1-1M6 7l-1-1M18 17l-1-1M6 17l-1 1" />
  </svg>
);

const CivilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
  </svg>
);


export const DEPARTMENTS: Department[] = [
  {
    id: 'cse',
    name: 'Computer Science and Engineering',
    icon: CseIcon,
    colorClasses: {
      bg: 'bg-sky-500',
      text: 'text-white',
      ring: 'focus:ring-sky-500',
    }
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    icon: MechIcon,
    colorClasses: {
      bg: 'bg-orange-500',
      text: 'text-white',
      ring: 'focus:ring-orange-500',
    }
  },
  {
    id: 'ece',
    name: 'Electronics and Communication Engineering',
    icon: EceIcon,
    colorClasses: {
      bg: 'bg-emerald-500',
      text: 'text-white',
      ring: 'focus:ring-emerald-500',
    }
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    icon: CivilIcon,
    colorClasses: {
      bg: 'bg-red-500',
      text: 'text-white',
      ring: 'focus:ring-red-500',
    }
  },
  {
    id: 'library',
    name: 'Library',
    icon: LibraryIcon,
    colorClasses: {
      bg: 'bg-indigo-500',
      text: 'text-white',
      ring: 'focus:ring-indigo-500',
    }
  },
];