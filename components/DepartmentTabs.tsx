import React from 'react';
import { Department } from '../types';

interface DepartmentTabsProps {
  departments: Department[];
  selectedDepartment: Department | null;
  onSelectDepartment: (department: Department) => void;
}

const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 shadow-2xl z-10">
      <div className="container mx-auto px-2 sm:px-4 py-3">
        <div className="flex flex-wrap justify-center gap-2">
          {departments.map((department) => {
            const Icon = department.icon;
            const isSelected = selectedDepartment?.id === department.id;
            return (
              <button
                key={department.id}
                onClick={() => onSelectDepartment(department)}
                className={`
                  flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out transform
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg
                  ${
                    isSelected
                      ? `${department.colorClasses.bg} ${department.colorClasses.text} ${department.colorClasses.ring} shadow-md scale-105`
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300 focus:ring-brand-primary'
                  }
                `}
              >
                <Icon />
                <span className="hidden sm:inline">{department.name}</span>
                <span className="sm:hidden">{department.id.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default DepartmentTabs;