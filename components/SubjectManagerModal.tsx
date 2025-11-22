import React, { useState } from 'react';
import { Subject } from '../types';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubjects: Subject[];
  onSave: (updatedSubjects: Subject[]) => void;
  departmentName: string;
  semester: number;
}

const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({ isOpen, onClose, initialSubjects, onSave, departmentName, semester }) => {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', category: ''});

  if (!isOpen) return null;

  const handleAddSubject = () => {
    const trimmedName = newSubject.name.trim();
    if (trimmedName && !subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      setSubjects([...subjects, {
          name: trimmedName,
          code: newSubject.code.trim(),
          category: newSubject.category.trim()
      }]);
      setNewSubject({ name: '', code: '', category: ''});
    } else if (trimmedName) {
      alert(`Subject "${trimmedName}" already exists.`);
    }
  };

  const handleRemoveSubject = (subjectToRemove: Subject) => {
    if (window.confirm(`Are you sure you want to remove the subject "${subjectToRemove.name}"? This will permanently delete all associated marks for every student in this semester.`)) {
        setSubjects(subjects.filter(s => s.name !== subjectToRemove.name));
    }
  };
  
  const handleSave = () => {
    onSave(subjects);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setNewSubject(prev => ({...prev, [name]: value}));
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Manage Subjects</h2>
          <p className="text-sm text-slate-500">{departmentName} - Semester {semester}</p>
        </header>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
           <div className="p-3 bg-yellow-400/20 border border-yellow-400/50 rounded-lg text-yellow-700 text-xs">
              <strong>Warning:</strong> Modifying subjects will affect all existing student records for this semester. Removing a subject will delete its marks permanently. Adding a subject will create a new entry with zero marks for all students.
           </div>
          
          <div className="space-y-2 p-3 rounded-lg bg-slate-100 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Add New Subject</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="name"
                type="text"
                value={newSubject.name}
                onChange={handleInputChange}
                placeholder="Subject Name"
                className="md:col-span-2 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
              />
               <input
                name="code"
                type="text"
                value={newSubject.code}
                onChange={handleInputChange}
                placeholder="Subject Code"
                className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
              />
               <input
                name="category"
                type="text"
                value={newSubject.category}
                onChange={handleInputChange}
                placeholder="Category (e.g., Core)"
                className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
             <button onClick={handleAddSubject} className="w-full mt-2 px-4 py-2 text-sm font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white">Add Subject</button>
          </div>
          
          <div className="space-y-2 pt-2">
            <h3 className="text-lg font-semibold text-slate-800">Current Subjects</h3>
            {subjects.length > 0 ? (
                <div className="space-y-2">
                {subjects.map(subject => (
                <div key={subject.name} className="flex justify-between items-center bg-slate-100 p-2.5 rounded-md">
                    <div>
                        <span className="text-slate-800 font-semibold">{subject.name}</span>
                        <div className="text-xs text-slate-500">
                            <span className="font-mono">{subject.code || 'No Code'}</span>
                            <span className="mx-2">|</span>
                            <span>{subject.category || 'No Category'}</span>
                        </div>
                    </div>
                    <button onClick={() => handleRemoveSubject(subject)} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                ))}
                </div>
            ) : (
                <p className="text-slate-500 text-sm italic text-center py-4">No subjects have been added for this semester yet.</p>
            )}
          </div>
        </div>

        <footer className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary text-white hover:bg-sky-400 transition-colors">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

export default SubjectManagerModal;