import React, { useState, useRef } from 'react';
import { PerformanceData, Student, FullStudentProfile, Department, SemesterMarks, Subject, SubjectMarks } from '../types';
import Card from './Card';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PerformanceDisplayProps {
  data: PerformanceData | null;
  isLoading: boolean;
  semester: number;
  department: Department;
  subjects: Subject[];
  onUpdateStudent: (student: Student) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'grade' | 'totalMarks'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onViewStudent: (student: FullStudentProfile) => void;
  onImportStudents: (students: Omit<Student, 'id' | 'grade' | 'totalMarks'>[]) => void;
  onManageSubjects: () => void;
  isFailedView?: boolean;
}

const getSubjectTotal = (subject: SubjectMarks): number => {
  const theoryEndSem = subject.reExam?.theoryEndSem !== undefined ? subject.reExam.theoryEndSem : subject.theoryEndSem;
  const practicalEndSem = subject.reExam?.practicalEndSem !== undefined ? subject.reExam.practicalEndSem : subject.practicalEndSem;

  return (
    (subject.theoryMidSem || 0) +
    (subject.theoryQuiz || 0) +
    (theoryEndSem || 0) +
    (practicalEndSem || 0) +
    (subject.practicalLabWork || 0)
  );
};

const PerformanceDisplay: React.FC<PerformanceDisplayProps> = ({
  data,
  isLoading,
  semester,
  department,
  subjects,
  onUpdateStudent,
  onAddStudent,
  onDeleteStudent,
  onViewStudent,
  onImportStudents,
  onManageSubjects,
  isFailedView = false,
}) => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showReExamFor, setShowReExamFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDefaultStudentData = (): Omit<Student, 'id' | 'grade' | 'totalMarks'> => {
    const defaultMarks: SemesterMarks = subjects.map(sub => ({
      subjectName: sub.name,
      theoryMidSem: 0,
      theoryQuiz: 0,
      theoryEndSem: 0,
      practicalEndSem: 0,
      practicalLabWork: 0,
    }));
    return {
      name: '',
      enrollmentNo: '',
      marks: defaultMarks,
    };
  };

  const [newStudentData, setNewStudentData] = useState(createDefaultStudentData());

  const toggleRowExpansion = (studentId: string) => {
    if (editingStudent?.id === studentId) return; // Don't collapse row being edited
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setEditingStudent(JSON.parse(JSON.stringify(student)));
    setIsAddingStudent(false);
    setShowReExamFor(null);
    setExpandedRows(prev => new Set(prev).add(student.id)); // Ensure row is expanded
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(null);
    setShowReExamFor(null);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingStudent) {
      onUpdateStudent(editingStudent);
      setEditingStudent(null);
      setShowReExamFor(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, studentId: string, studentName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently remove ${studentName} from this batch? This action cannot be undone.`)) {
      onDeleteStudent(studentId);
    }
  };

  const handleAddClick = () => {
    if (subjects.length === 0) {
      alert("Please add subjects for this semester before adding students. Click 'Manage Subjects' to begin.");
      return;
    }
    setIsAddingStudent(true);
    setNewStudentData(createDefaultStudentData());
    setEditingStudent(null);
    setExpandedRows(new Set());
  };

  const handleCancelAddClick = () => {
    setIsAddingStudent(false);
  };

  const handleSaveNewStudentClick = () => {
    onAddStudent(newStudentData);
    setIsAddingStudent(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;

    if (name === 'sgpa' || name === 'cgpa') {
      finalValue = value === '' ? 0 : parseFloat(value);
    }

    if (isNew) {
      setNewStudentData(prev => ({ ...prev, [name]: finalValue }));
    } else if (editingStudent) {
      setEditingStudent(prev => prev ? { ...prev, [name]: finalValue } : null);
    }
  };

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>, subjectName: string, isNew: boolean) => {
    const { name, value } = e.target;
    let max = 100;
    switch (name) {
      case 'theoryMidSem':
      case 'practicalLabWork':
        max = 20;
        break;
      case 'theoryQuiz':
        max = 10;
        break;
      case 'theoryEndSem':
        max = 70;
        break;
      case 'practicalEndSem':
        max = 30;
        break;
    }

    const numValue = Math.max(0, Math.min(max, parseInt(value, 10) || 0));

    const updateMarks = (prevMarks: SemesterMarks): SemesterMarks => {
      return prevMarks.map(subject =>
        subject.subjectName === subjectName
          ? { ...subject, [name]: numValue }
          : subject
      );
    };

    if (isNew) {
      setNewStudentData(prev => ({
        ...prev,
        marks: updateMarks(prev.marks),
      }));
    } else if (editingStudent) {
      setEditingStudent(prev => prev ? ({
        ...prev,
        marks: updateMarks(prev.marks),
      }) : null);
    }
  };

  const handleReExamMarksChange = (e: React.ChangeEvent<HTMLInputElement>, subjectName: string) => {
    const { name, value } = e.target;
    const max = name === 'theoryEndSem' ? 70 : 30;
    const numValue = value === '' ? undefined : Math.max(0, Math.min(max, parseInt(value, 10) || 0));

    if (editingStudent) {
      setEditingStudent(prev => {
        if (!prev) return null;
        const newMarks = prev.marks.map(subject => {
          if (subject.subjectName === subjectName) {
            const newReExam = {
              ...subject.reExam,
              [name]: numValue
            };
            // If both re-exam fields are undefined, remove the reExam object
            if (newReExam.theoryEndSem === undefined && newReExam.practicalEndSem === undefined) {
              const { reExam, ...rest } = subject;
              return rest;
            }
            return { ...subject, reExam: newReExam };
          }
          return subject;
        });
        return { ...prev, marks: newMarks };
      });
    }
  };

  const handleImportClick = () => {
    if (subjects.length === 0) {
      alert("Cannot import data. Please add subjects for this semester first via 'Manage Subjects'.");
      return;
    }
    fileInputRef.current?.click();
  };

  const parseCSV = (csvText: string): Omit<Student, 'id' | 'grade' | 'totalMarks'>[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV file is empty or has only a header.");

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/gi, ''));

    const nameIndex = header.findIndex(h => ['listofstudents', 'studentname', 'name'].includes(h));
    const enrollmentIndex = header.findIndex(h => ['enrollmentno', 'enrollmentnumber', 'enrollment'].includes(h));

    if (nameIndex === -1) {
      throw new Error("CSV header is missing a column for student names. Expected something like 'List of Students' or 'Name'.");
    }
    if (enrollmentIndex === -1) {
      throw new Error("CSV header is missing a column for enrollment numbers. Expected something like 'Enrollment No'.");
    }

    const students = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const name = values[nameIndex] ? values[nameIndex].trim().replace(/^"|"$/g, '') : '';
      const enrollmentNo = values[enrollmentIndex] ? values[enrollmentIndex].trim().replace(/^"|"$/g, '') : '';

      if (!name || !enrollmentNo) {
        console.warn(`Skipping row ${index + 2} due to missing name or enrollment number.`);
        return null;
      }

      const marks: SemesterMarks = subjects.map(sub => ({
        subjectName: sub.name,
        theoryMidSem: 0,
        theoryQuiz: 0,
        theoryEndSem: 0,
        practicalEndSem: 0,
        practicalLabWork: 0,
      }));

      return {
        name,
        enrollmentNo,
        marks,
      };
    }).filter((s): s is Omit<Student, 'id' | 'grade' | 'totalMarks'> => s !== null);

    return students;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      alert('Please select a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsedData = parseCSV(text);
        onImportStudents(parsedData);
        alert(`${parsedData.length} students imported/updated successfully!`);
      } catch (error: any) {
        alert(`Error importing CSV: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input to allow re-upload
  };

  const handleExportClick = () => {
    if (!data || !data.students || data.students.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ['S.No', 'Enrollment No', 'Name', 'Result', 'SGPA', 'CGPA'];
    let csvContent = headers.join(",") + "\n";

    data.students.forEach((student, index) => {
      const hasFailed = (Array.isArray(student.marks) ? student.marks : []).some(s => s.grade === 'F');
      const result = hasFailed ? 'FAIL' : 'PASS';

      const sgpa = student.sgpa !== undefined ? student.sgpa : calculateSGPA(student.marks);
      const cgpa = student.cgpa !== undefined ? student.cgpa : calculateCGPA(student);

      const row = [
        index + 1,
        student.enrollmentNo,
        `"${student.name.replace(/"/g, '""')}"`,
        result,
        sgpa,
        cgpa
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `${department.name.replace(/\s+/g, '-')}_Sem${semester}_Student-List.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <p className="text-slate-600 text-lg">No data available for this selection.</p>
          <p className="text-slate-500 text-sm mt-1">Add a student or manage subjects to get started.</p>
        </div>
      </div>
    );
  }

  const totalMaxMarks = subjects.length * 150; // Approximation based on PDF

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>, subjectName: string, isNew: boolean) => {
    const { value } = e.target;

    const updateMarks = (prevMarks: SemesterMarks): SemesterMarks => {
      return prevMarks.map(subject =>
        subject.subjectName === subjectName
          ? { ...subject, grade: value }
          : subject
      );
    };

    if (isNew) {
      setNewStudentData(prev => ({
        ...prev,
        marks: updateMarks(prev.marks),
      }));
    } else if (editingStudent) {
      setEditingStudent(prev => prev ? ({
        ...prev,
        marks: updateMarks(prev.marks),
      }) : null);
    }
  };

  const renderSubjectDetailsRow = (student: Student, isEditing: boolean, isNew: boolean) => {
    const studentData = isEditing ? (editingStudent || student) : (isNew ? newStudentData : student);

    return (
      <tr className="bg-slate-50">
        <td colSpan={8} className="p-0">
          <div className="p-4">
            <h4 className="font-bold text-slate-800 mb-2 text-base">Subject Grades</h4>
            {subjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 text-left font-medium">S.No</th>
                      <th className="p-2 text-left font-medium">Subject Code</th>
                      <th className="p-2 text-left font-medium">Subject Name</th>
                      <th className="p-2 text-center font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentData.marks || []).map((subjectMarks, idx) => {
                      const subjectInfo = subjects.find(s => s.name === subjectMarks.subjectName);

                      return (
                        <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                          <td className="p-2 text-slate-700">{idx + 1}</td>
                          <td className="p-2 text-slate-700 font-mono">{subjectInfo?.code || '-'}</td>
                          <td className="p-2 text-slate-700">{subjectMarks.subjectName}</td>
                          <td className="p-2 text-center">
                            {isEditing || isNew ? (
                              <select
                                value={subjectMarks.grade || ''}
                                onChange={(e) => handleGradeChange(e, subjectMarks.subjectName, isNew)}
                                onClick={e => e.stopPropagation()}
                                className="bg-white border border-slate-300 rounded px-2 py-1 w-24 text-center"
                              >
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A">A</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                                <option value="C+">C+</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="F">F</option>
                              </select>
                            ) : (
                              <span className={`font-bold ${subjectMarks.grade === 'F' ? 'text-red-600' : 'text-slate-800'}`}>
                                {subjectMarks.grade || '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No subjects defined for this semester.</p>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const calculateSGPA = (marks: SemesterMarks): number => {
    if (!marks || marks.length === 0) return 0;

    const gradePoints: Record<string, number> = {
      'A+': 10,
      'A': 9,
      'B+': 8,
      'B': 7,
      'C+': 6,
      'C': 5,
      'D': 4,
      'F': 0
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

  const calculateCGPA = (student: FullStudentProfile): number => {
    const history = student.academicHistory || {};
    const manualAggregates = student.manualAggregates || {};

    let totalSGPA = 0;
    let count = 0;

    // Iterate through all possible semesters (1 to 8)
    for (let i = 1; i <= 8; i++) {
      const semMarks = history[i];
      const manualSemData = manualAggregates[i];

      if (manualSemData?.sgpa !== undefined) {
        totalSGPA += manualSemData.sgpa;
        count++;
      } else if (semMarks) {
        totalSGPA += calculateSGPA(semMarks);
        count++;
      }
    }

    return count > 0 ? parseFloat((totalSGPA / count).toFixed(2)) : 0;
  };

  const renderStudentRow = (student: Student, isEditing: boolean, isNew: boolean, index?: number) => {
    const displayStudent = isNew ? newStudentData : (editingStudent && editingStudent.id === student.id ? editingStudent : student);

    // Result Logic
    const hasFailed = (Array.isArray(displayStudent.marks) ? displayStudent.marks : []).some(s => s.grade === 'F');
    const result = hasFailed ? 'FAIL' : 'PASS';
    const resultColor = hasFailed ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100';

    const sgpa = calculateSGPA(displayStudent.marks);
    const cgpa = !isNew ? calculateCGPA(student as FullStudentProfile) : sgpa; // For new student, CGPA = SGPA

    return (
      <tr
        key={isNew ? 'new-student' : student.id}
        className={`border-b border-slate-200 transition-colors duration-200 ${isEditing ? 'bg-brand-primary/10' : 'hover:bg-slate-100 cursor-pointer'}`}
        onClick={() => !isNew && toggleRowExpansion(student.id)}
      >
        <td className="p-3 text-slate-600 text-center">{index !== undefined ? index + 1 : '-'}</td>
        <td className="p-3 text-slate-600 font-mono">
          {isEditing || isNew ? (
            <input name="enrollmentNo" type="text" value={displayStudent.enrollmentNo} onChange={(e) => handleInputChange(e, isNew)} onClick={e => e.stopPropagation()} className="bg-white border border-slate-300 rounded px-2 py-1 w-full disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-500" disabled={isEditing} />
          ) : student.enrollmentNo}
        </td>
        <td className="p-3 text-slate-800 font-medium">
          {isEditing || isNew ? (
            <input name="name" type="text" value={displayStudent.name} onChange={(e) => handleInputChange(e, isNew)} onClick={e => e.stopPropagation()} className="bg-white border border-slate-300 rounded px-2 py-1 w-full" />
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); onViewStudent(student as FullStudentProfile); }}
              className="cursor-pointer hover:text-brand-primary hover:underline transition-colors"
              title={`View report for ${student.name}`}
            >
              {student.name}
            </span>
          )}
        </td>
        <td className="p-3 text-center">
          <span className={`px-2 py-1 rounded text-xs font-bold ${resultColor}`}>
            {result}
          </span>
        </td>
        <td className="p-3 text-slate-900 font-bold text-center">
          {isEditing || isNew ? (
            <input
              type="number"
              step="0.01"
              name="sgpa"
              value={displayStudent.sgpa !== undefined ? displayStudent.sgpa : sgpa}
              onChange={(e) => handleInputChange(e, isNew)}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded px-2 py-1 w-20 text-center"
            />
          ) : (
            displayStudent.sgpa !== undefined ? displayStudent.sgpa : sgpa
          )}
        </td>
        <td className="p-3 text-slate-900 font-bold text-center">
          {isEditing || isNew ? (
            <input
              type="number"
              step="0.01"
              name="cgpa"
              value={displayStudent.cgpa !== undefined ? displayStudent.cgpa : cgpa}
              onChange={(e) => handleInputChange(e, isNew)}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded px-2 py-1 w-20 text-center"
            />
          ) : (
            displayStudent.cgpa !== undefined ? displayStudent.cgpa : cgpa
          )}
        </td>
        <td className="p-3 text-center">
          <select
            className="bg-white border border-slate-300 rounded px-2 py-1 text-sm"
            onClick={e => e.stopPropagation()}
            defaultValue="Jan-Jun 2024"
          >
            <option value="Jan-Jun 2024">Jan-Jun 2024</option>
            <option value="Jul-Dec 2024">Jul-Dec 2024</option>
            <option value="Jan-Jun 2025">Jan-Jun 2025</option>
            <option value="Jul-Dec 2025">Jul-Dec 2025</option>
          </select>
        </td>
        <td className="p-3 text-center">
          {isEditing ? (
            <div className="flex gap-2 justify-center">
              <button onClick={handleSaveClick} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Save</button>
              <button onClick={handleCancelClick} className="px-2 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-800">Cancel</button>
            </div>
          ) : isNew ? (
            <div className="flex gap-2 justify-center">
              <button onClick={handleSaveNewStudentClick} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Save</button>
              <button onClick={handleCancelAddClick} className="px-2 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-800">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2 justify-center items-center">
              <button onClick={(e) => handleEditClick(e, student)} className="px-3 py-1 text-xs rounded-md bg-sky-600 hover:bg-sky-500 text-white">Modify</button>
              <button
                onClick={(e) => handleDeleteClick(e, student.id, student.name)}
                title={`Permanently remove ${student.name}`}
                className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className={`text-3xl font-bold text-center text-transparent bg-clip-text ${isFailedView ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-gradient-to-r from-slate-800 to-slate-600'}`}>
        {department.name} - Semester {semester} {isFailedView ? '(Failed Students)' : 'Performance'}
      </h2>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-800">Academic Records</h3>
            <button onClick={onManageSubjects} title="Manage Subjects" className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Manage Subjects
            </button>
          </div>
          {!isAddingStudent && !editingStudent && (
            <button onClick={handleAddClick} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Student
            </button>
          )}
        </div>
        <div className="overflow-auto max-h-[450px]">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm text-slate-600 font-semibold">
              <tr className="border-b border-slate-200">
                <th className="p-3">S.No</th>
                <th className="p-3">Enrollment No</th>
                <th className="p-3">Name</th>
                <th className="p-3 text-center">Result</th>
                <th className="p-3 text-center">SGPA</th>
                <th className="p-3 text-center">CGPA</th>
                <th className="p-3 text-center">Session</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr:not(.bg-brand-primary\/10):not(.bg-slate-50):nth-child(even)]:bg-slate-100/50">
              {data.students.map((student: FullStudentProfile, index: number) => {
                const isEditing = editingStudent?.id === student.id;
                return (
                  <React.Fragment key={student.id}>
                    {renderStudentRow(student, isEditing, false, index)}
                    {(expandedRows.has(student.id) || isEditing) && renderSubjectDetailsRow(student, isEditing, false)}
                  </React.Fragment>
                );
              })}
              {isAddingStudent && (
                <React.Fragment>
                  {renderStudentRow(newStudentData as Student, false, true)}
                  {renderSubjectDetailsRow(newStudentData as Student, false, true)}
                </React.Fragment>
              )}
              {data.students.length === 0 && !isAddingStudent && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-500">
                    No students found for this semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pt-4 mt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: 'none' }} />
          <button onClick={handleImportClick} className="w-full text-center px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors duration-200 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import from CSV
          </button>
          <button onClick={handleExportClick} className="w-full text-center px-4 py-2 rounded-lg text-sm font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors duration-200 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export to CSV
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        {!isFailedView && (
          <>
            <Card>
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-600">Average Performance</h3>
                  <p className="text-4xl font-bold text-brand-primary">{data.averagePercentage.toFixed(2)}%</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-600">Pass Percentage</h3>
                  <p className="text-4xl font-bold text-emerald-500">{data.passPercentage.toFixed(2)}%</p>
                </div>
              </div>
            </Card>
          </>
        )}
        <Card>
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-600">Total Students</h3>
              <p className="text-4xl font-bold text-sky-500">{data.students.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDisplay;