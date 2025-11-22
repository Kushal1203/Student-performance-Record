import React, { useState } from 'react';
import { FullStudentProfile, SemesterMarks } from '../types';
import Card from './Card';

interface StudentReportModalProps {
  student: FullStudentProfile;
  onClose: () => void;
  onSave: (updatedProfile: FullStudentProfile) => void;
}

// Helper function to calculate SGPA from grades
const calculateSGPA = (marks: SemesterMarks): number => {
  if (!marks || marks.length === 0) return 0;
  const gradePoints: Record<string, number> = {
    'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
  };
  let totalPoints = 0;
  let totalSubjects = 0;
  marks.forEach(sub => {
    if (sub.grade && gradePoints.hasOwnProperty(sub.grade)) {
      totalPoints += gradePoints[sub.grade];
      totalSubjects++;
    }
  });
  return totalSubjects > 0 ? parseFloat((totalPoints / totalSubjects).toFixed(2)) : 0;
};

// Helper function to calculate cumulative CGPA
const calculateCumulativeCGPA = (
  academicHistory: Record<number, SemesterMarks | null>,
  manualAggregates?: Record<number, { sgpa?: number; cgpa?: number }>
): number => {
  let totalSGPA = 0;
  let count = 0;
  for (let i = 1; i <= 8; i++) {
    const semMarks = academicHistory[i];
    const manualData = manualAggregates?.[i];
    if (manualData?.sgpa !== undefined) {
      totalSGPA += manualData.sgpa;
      count++;
    } else if (semMarks) {
      totalSGPA += calculateSGPA(semMarks);
      count++;
    }
  }
  return count > 0 ? parseFloat((totalSGPA / count).toFixed(2)) : 0;
};

const StudentReportModal: React.FC<StudentReportModalProps> = ({ student, onClose, onSave }) => {
  const [editedProfile, setEditedProfile] = useState<FullStudentProfile>(JSON.parse(JSON.stringify(student)));
  const [newItem, setNewItem] = useState<{ sports: string; extracurricular: string }>({ sports: '', extracurricular: '' });

  const handleSave = () => {
    onSave(editedProfile);
    onClose();
  };

  const handleAddItem = (type: 'sports' | 'extracurricular') => {
    const value = newItem[type].trim();
    if (value && !editedProfile[type].includes(value)) {
      setEditedProfile(prev => ({
        ...prev,
        [type]: [...prev[type], value]
      }));
      setNewItem(prev => ({ ...prev, [type]: '' }));
    }
  };

  const handleRemoveItem = (type: 'sports' | 'extracurricular', item: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i !== item)
    }));
  };

  const handleAccountChange = (field: keyof FullStudentProfile['accounts'], value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [field]: value,
      }
    }));
  };

  const handleGradeChange = (semesterNum: number, subjectName: string, newGrade: string) => {
    const marks = editedProfile.academicHistory[semesterNum];
    if (!marks) return;
    const updatedMarks = marks.map(s => s.subjectName === subjectName ? { ...s, grade: newGrade } : s);
    setEditedProfile(prev => ({
      ...prev,
      academicHistory: { ...prev.academicHistory, [semesterNum]: updatedMarks }
    }));
  };

  const handleAggregateChange = (semesterNum: number, field: 'sgpa' | 'cgpa', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedProfile(prev => ({
      ...prev,
      manualAggregates: {
        ...(prev.manualAggregates || {}),
        [semesterNum]: {
          ...(prev.manualAggregates?.[semesterNum] || {}),
          [field]: numValue
        }
      }
    }));
  };

  const handleSessionChange = (semesterNum: number, session: string) => {
    setEditedProfile(prev => ({
      ...prev,
      sessionData: {
        ...(prev.sessionData || {}),
        [semesterNum]: session
      }
    }));
  };

  const renderEditableList = (title: string, type: 'sports' | 'extracurricular') => (
    <Card>
      <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {editedProfile[type].map(item => (
          <div key={item} className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
            <span className="text-slate-700">{item}</span>
            <button onClick={() => handleRemoveItem(type, item)} className="text-red-500 hover:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
        {editedProfile[type].length === 0 && <p className="text-slate-500 text-sm italic">No entries yet.</p>}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newItem[type]}
          onChange={e => setNewItem(prev => ({ ...prev, [type]: e.target.value }))}
          placeholder={`Add new ${type.slice(0, -1)}...`}
          className="flex-grow bg-white border border-slate-300 rounded-md px-2 py-1 text-sm"
        />
        <button onClick={() => handleAddItem(type)} className="px-3 py-1 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white">Add</button>
      </div>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <header className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-sm text-slate-500 font-mono">{student.enrollmentNo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-6 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Full Academic History</h3>
            <div className="space-y-6">
              {Object.entries(editedProfile.academicHistory).map(([sem, marks]) => {
                const semesterNum = parseInt(sem);
                const manualData = editedProfile.manualAggregates?.[semesterNum];

                const sgpa = manualData?.sgpa !== undefined ? manualData.sgpa : (marks ? calculateSGPA(marks) : 0);
                const cgpa = manualData?.cgpa !== undefined ? manualData.cgpa : calculateCumulativeCGPA(editedProfile.academicHistory, editedProfile.manualAggregates);
                const hasFailed = (marks || []).some(s => s.grade === 'F');
                const result = hasFailed ? 'FAIL' : 'PASS';
                const resultColor = hasFailed ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100';
                const currentSession = (editedProfile.sessionData?.[semesterNum]) || 'Jan-Jun 2024';

                return (
                  <div key={sem} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                      <div className="font-bold text-slate-700 text-lg">Semester {sem}</div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className={`px-3 py-1 rounded text-sm font-bold ${resultColor}`}>{result}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">SGPA:</span>
                          <input
                            type="number"
                            step="0.01"
                            value={sgpa}
                            onChange={(e) => handleAggregateChange(semesterNum, 'sgpa', e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-slate-300 rounded text-center font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">CGPA:</span>
                          <input
                            type="number"
                            step="0.01"
                            value={cgpa}
                            onChange={(e) => handleAggregateChange(semesterNum, 'cgpa', e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-slate-300 rounded text-center font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-600">Session:</span>
                          <select
                            value={currentSession}
                            onChange={(e) => handleSessionChange(semesterNum, e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded bg-white"
                          >
                            <option>Jan-Jun 2024</option>
                            <option>Jul-Dec 2024</option>
                            <option>Jan-Jun 2025</option>
                            <option>Jul-Dec 2025</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {marks && marks.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead className="text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-2 text-left font-medium">Subject Name</th>
                              <th className="p-2 text-center font-medium">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marks.map((subject, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0">
                                <td className="p-2 text-slate-700">{subject.subjectName}</td>
                                <td className="p-2 text-center">
                                  <select
                                    value={subject.grade || ''}
                                    onChange={(e) => handleGradeChange(semesterNum, subject.subjectName, e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-2 py-1 w-20 text-center text-sm"
                                  >
                                    <option value="">-</option>
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B+">B+</option>
                                    <option value="B">B</option>
                                    <option value="C+">C+</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="F">F</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-slate-500 italic text-center">No subjects found.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Library Records</h3>
            <div className="overflow-x-auto">
              {editedProfile.library && editedProfile.library.length > 0 ? (
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-200/50 text-slate-600">
                    <tr>
                      <th className="p-2">Book Name</th>
                      <th className="p-2">Book Code</th>
                      <th className="p-2">Issue Date</th>
                      <th className="p-2">Return Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedProfile.library.map(record => (
                      <tr key={record.id} className="border-b border-slate-200 last:border-b-0">
                        <td className="p-2 font-medium text-slate-800">{record.bookName}</td>
                        <td className="p-2 text-slate-600 font-mono">{record.bookCode}</td>
                        <td className="p-2 text-slate-600">{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td className="p-2 text-slate-600">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${record.isReturned ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                            {record.isReturned ? 'Returned' : 'Not Returned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 italic text-center py-2">No library records found.</p>
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {renderEditableList('Sports', 'sports')}
            {renderEditableList('Extracurricular Activities', 'extracurricular')}
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Accounts Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">College Fee Status:</span>
                <button onClick={() => handleAccountChange('collegeFeeDue', !editedProfile.accounts.collegeFeeDue)}
                  className={`px-3 py-1 text-sm font-bold rounded-full ${editedProfile.accounts.collegeFeeDue ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                >
                  {editedProfile.accounts.collegeFeeDue ? 'DUE' : 'NO DUE'}
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <label htmlFor="hostelCheck" className="text-slate-600">Availing Hostel:</label>
                <input
                  id="hostelCheck"
                  type="checkbox"
                  checked={editedProfile.accounts.isHostelResident}
                  onChange={e => handleAccountChange('isHostelResident', e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-200 border-slate-400 text-brand-primary focus:ring-brand-primary"
                />
              </div>
              {editedProfile.accounts.isHostelResident && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Hostel Fee Status:</span>
                  <button onClick={() => handleAccountChange('hostelFeeDue', !editedProfile.accounts.hostelFeeDue)}
                    className={`px-3 py-1 text-sm font-bold rounded-full ${editedProfile.accounts.hostelFeeDue ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                  >
                    {editedProfile.accounts.hostelFeeDue ? 'DUE' : 'NO DUE'}
                  </button>
                </div>
              )}
            </div>
          </Card>

        </div>

        <footer className="sticky bottom-0 bg-slate-50/80 backdrop-blur-sm z-10 p-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors">Close</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-primary text-white hover:bg-sky-400 transition-colors">Save Changes</button>
        </footer>
      </div>
    </div>
  );
};

export default StudentReportModal;