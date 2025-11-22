import React from 'react';
import { YearData } from '../types';

interface SemesterSelectorProps {
  years: YearData[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  selectedSemester: number | null;
  onSelectSemester: (semester: number) => void;
}

const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  years,
  selectedYear,
  onSelectYear,
  selectedSemester,
  onSelectSemester,
}) => {
  const selectedYearData = years.find(y => y.year === selectedYear);

  const getYearSuffix = (year: number) => {
    switch (year) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-center text-slate-800">Select Year</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {years.map(({ year }) => (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
              className={`
                p-3 rounded-lg text-sm md:text-base font-bold transition-all duration-200 ease-in-out transform 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary
                ${
                  selectedYear === year
                    ? 'bg-gradient-to-r from-brand-primary to-sky-400 text-white shadow-lg shadow-brand-primary/20 scale-105'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }
              `}
            >
              {year}{getYearSuffix(year)} Year
            </button>
          ))}
        </div>
      </div>

      {selectedYearData && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-center text-slate-800">Select Semester</h2>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {selectedYearData.semesters.map((semester) => (
              <button
                key={semester}
                onClick={() => onSelectSemester(semester)}
                className={`
                  p-3 rounded-lg text-sm md:text-base font-bold transition-all duration-200 ease-in-out transform 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary
                  ${
                    selectedSemester === semester
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }
                `}
              >
                Semester {semester}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterSelector;