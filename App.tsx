import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SemesterSelector from './components/SemesterSelector';
import DepartmentTabs from './components/DepartmentTabs';
import PerformanceDisplay from './components/PerformanceDisplay';
import LibraryDisplay from './components/LibraryDisplay';
import BatchSelector from './components/BatchSelector';
import StudentReportModal from './components/StudentReportModal';
import SubjectManagerModal from './components/SubjectManagerModal';
import Footer from './components/Footer';
import { PerformanceData, Department, Student, FullStudentProfile, SemesterMarks, Subject, SubjectMarks } from './types';
import { YEARS, DEPARTMENTS } from './constants';
import { getStudentsForBatchDept, updateStudentsForBatchDept, getSubjectsForDeptSem, updateSubjectsForDeptSem } from './services/studentDataService';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';

const getGrade = (marks: number, totalMaxMarks: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (totalMaxMarks === 0) return 'F';
  const percentage = (marks / totalMaxMarks) * 100;

  if (percentage > 120 || percentage < 0) return 'F';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

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

const recalculateAggregates = (students: Student[], totalMaxMarks: number): Omit<PerformanceData, 'students'> => {
  if (students.length === 0) {
    return {
      averagePercentage: 0,
      passPercentage: 0,
    };
  }

  const validStudents = students.filter(s => s.totalMarks > 0);
  if (validStudents.length === 0) {
    return {
      averagePercentage: 0,
      passPercentage: 0,
    };
  }

  const totalScoreSum = validStudents.reduce((acc, student) => acc + student.totalMarks, 0);
  const averagePercentage = totalMaxMarks > 0 ? (totalScoreSum / validStudents.length / totalMaxMarks) * 100 : 0;

  const passedStudents = validStudents.filter(s => s.grade !== 'F').length;
  const passPercentage = (passedStudents / validStudents.length) * 100;

  return { averagePercentage, passPercentage };
};

const preparePerformanceDataForSemester = (students: FullStudentProfile[], semester: number, subjects: Subject[]): PerformanceData => {
  // Max marks from PDF for a full subject: End Sem(70) + Mid Sem(20) + Quiz(10) + Practical End Sem(30) + Practical Lab(20) = 150
  const totalMaxMarks = subjects.length * 150; // NOTE: This is an approximation as subjects have different total marks in the PDF.

  const studentsForSemester: FullStudentProfile[] = students.map(student => {
    const semesterMarksData = student.academicHistory[semester];
    const semesterMarks: SemesterMarks = Array.isArray(semesterMarksData) ? semesterMarksData : [];
    const totalMarks = semesterMarks
      .filter(subject => subject && typeof subject.subjectName === 'string') // Basic check
      .reduce((sum, subject) => sum + getSubjectTotal(subject), 0);
    const grade = getGrade(totalMarks, totalMaxMarks);

    // Check for manual aggregates
    const manualData = student.manualAggregates?.[semester];

    return {
      ...student,
      marks: semesterMarks,
      totalMarks,
      grade,
      sgpa: manualData?.sgpa,
      cgpa: manualData?.cgpa,
    };
  }).sort((a, b) => b.totalMarks - a.totalMarks);

  const aggregates = recalculateAggregates(studentsForSemester, totalMaxMarks);
  return { ...aggregates, students: studentsForSemester };
};


function App() {
  const [batches, setBatches] = useState<string[]>(['2023-2027', '2024-2028']);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [activeAcademicDepartmentId, setActiveAcademicDepartmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all');

  const selectedDepartment = DEPARTMENTS.find(d => d.id === selectedDepartmentId) || null;
  const activeAcademicDepartment = DEPARTMENTS.find(d => d.id !== 'library' && d.id === activeAcademicDepartmentId) || null;

  const [allStudents, setAllStudents] = useState<FullStudentProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewingStudent, setViewingStudent] = useState<FullStudentProfile | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Auth State
  const { user, logout } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  // Effect 1: Fetch master student list when batch or active department changes
  useEffect(() => {
    if (selectedBatch && activeAcademicDepartment) {
      setIsLoading(true);
      setPerformanceData(null); // Clear previous semester's view data

      const fetchStudents = async () => {
        try {
          const students = await getStudentsForBatchDept(activeAcademicDepartment.name, selectedBatch);
          setAllStudents(students);
        } catch (error) {
          console.error("Failed to fetch students", error);
        } finally {
          // We don't set loading false here because we might need to wait for subjects/semester data processing
        }
      };

      fetchStudents();

      return () => { };
    } else {
      setAllStudents([]); // Clear master list if no batch/dept
    }
  }, [selectedBatch, activeAcademicDepartment]);

  // Effect 2: Fetch subjects when department or semester changes
  useEffect(() => {
    if (activeAcademicDepartment && selectedSemester) {
      const fetchSubjects = async () => {
        try {
          const fetchedSubjects = await getSubjectsForDeptSem(activeAcademicDepartment.id, selectedSemester);
          setSubjects(fetchedSubjects);
        } catch (error) {
          console.error("Failed to fetch subjects", error);
        }
      };
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [activeAcademicDepartment, selectedSemester]);


  // Effect 3: Prepare semester-specific data for display when master list, semester or subjects change
  useEffect(() => {
    if (selectedBatch && activeAcademicDepartment && selectedSemester && selectedDepartmentId !== 'library') {
      const semesterData = preparePerformanceDataForSemester(allStudents, selectedSemester, subjects);
      setPerformanceData(semesterData);
      setIsLoading(false);
    } else if (selectedDepartmentId === 'library' || !selectedSemester) {
      setIsLoading(false); // Stop loading for library view or if semester is deselected
      setPerformanceData(null);
    }
  }, [allStudents, selectedSemester, activeAcademicDepartment, subjects, selectedDepartmentId, selectedBatch]);


  const handleUpdateSubjects = (newSubjects: Subject[]) => {
    if (!activeAcademicDepartment || !selectedSemester || !selectedBatch) return;

    // Update subjects in storage
    updateSubjectsForDeptSem(activeAcademicDepartment.id, selectedSemester, newSubjects);
    setSubjects(newSubjects);

    // Sync all students in the current batch/dept with the new subject list
    const updatedStudents = allStudents.map(student => {
      const currentMarksData = student.academicHistory[selectedSemester!];
      const currentMarks: SemesterMarks = (Array.isArray(currentMarksData) ? currentMarksData : []).filter(s => s && typeof s.subjectName === 'string');

      const newMarks: SemesterMarks = newSubjects.map(sub => {
        const existingSubject = currentMarks.find(s => s.subjectName === sub.name);
        if (existingSubject) {
          return existingSubject;
        }
        return {
          subjectName: sub.name,
          theoryMidSem: 0,
          theoryQuiz: 0,
          theoryEndSem: 0,
          practicalEndSem: 0,
          practicalLabWork: 0
        };
      });

      const updatedHistory = { ...student.academicHistory, [selectedSemester!]: newMarks };
      return { ...student, academicHistory: updatedHistory };
    });

    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(selectedBatch, activeAcademicDepartment.name, updatedStudents);
    setIsSubjectModalOpen(false);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (!selectedBatch || !selectedSemester || !activeAcademicDepartment) return;

    const batch = selectedBatch;
    const semester = selectedSemester;
    const department = activeAcademicDepartment;

    const updatedStudents = allStudents.map(s => {
      if (s.id === updatedStudent.id) {
        const updatedHistory = { ...s.academicHistory, [semester]: updatedStudent.marks };
        const updatedManualAggregates = {
          ...(s.manualAggregates || {}),
          [semester]: {
            sgpa: updatedStudent.sgpa,
            cgpa: updatedStudent.cgpa
          }
        };
        return { ...s, academicHistory: updatedHistory, manualAggregates: updatedManualAggregates };
      }
      return s;
    });

    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(batch, department.name, updatedStudents);
  };

  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'grade' | 'totalMarks'>) => {
    if (!selectedBatch || !selectedSemester || !activeAcademicDepartment) return;

    if (!newStudentData.enrollmentNo.trim()) {
      alert("Enrollment Number cannot be empty.");
      return;
    }
    if (allStudents.some(s => s.enrollmentNo === newStudentData.enrollmentNo)) {
      alert(`A student with enrollment number ${newStudentData.enrollmentNo} already exists in this batch.`);
      return;
    }

    const batch = selectedBatch;
    const semester = selectedSemester;
    const department = activeAcademicDepartment;

    const totalMaxMarks = subjects.length * 150;

    const newMarks: SemesterMarks = newStudentData.marks;
    const newTotalMarks = newMarks.reduce((sum, s) => sum + getSubjectTotal(s), 0);

    const academicHistory: Record<number, SemesterMarks | null> = {};
    for (let i = 1; i <= 8; i++) {
      academicHistory[i] = i === semester ? newStudentData.marks : null;
    }

    const newStudent: FullStudentProfile = {
      ...newStudentData,
      id: newStudentData.enrollmentNo, // Use enrollmentNo as ID
      totalMarks: newTotalMarks,
      grade: getGrade(newTotalMarks, totalMaxMarks),
      academicHistory,
      manualAggregates: {
        [semester]: { sgpa: newStudentData.sgpa, cgpa: newStudentData.cgpa }
      },
      sports: [],
      extracurricular: [],
      accounts: {
        collegeFeeDue: false,
        isHostelResident: false,
        hostelFeeDue: false,
      },
      library: [],
    };

    const updatedStudents = [...allStudents, newStudent];
    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(batch, department.name, updatedStudents);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!selectedBatch || !activeAcademicDepartment) return;

    const batch = selectedBatch;
    const department = activeAcademicDepartment;

    const updatedStudents = allStudents.filter(s => s.id !== studentId);
    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(batch, department.name, updatedStudents);
  };

  const handleImportStudents = (importedStudents: Omit<Student, 'id' | 'grade' | 'totalMarks'>[]) => {
    if (!selectedBatch || !selectedSemester || !activeAcademicDepartment) {
      alert("Cannot import data without a selected batch, semester, and department.");
      return;
    }
    const batch = selectedBatch;
    const semester = selectedSemester;
    const department = activeAcademicDepartment;

    const totalMaxMarks = subjects.length * 150;

    const studentMap = new Map<string, FullStudentProfile>(allStudents.map(s => [s.enrollmentNo, JSON.parse(JSON.stringify(s))]));

    importedStudents.forEach(importedStudent => {
      const existingStudent = studentMap.get(importedStudent.enrollmentNo);

      if (existingStudent) {
        existingStudent.academicHistory[semester] = importedStudent.marks;
        studentMap.set(existingStudent.enrollmentNo, existingStudent);
      } else {
        const newTotalMarks = importedStudent.marks.reduce((sum, s) => sum + getSubjectTotal(s), 0);
        const academicHistory: Record<number, SemesterMarks | null> = {};
        for (let i = 1; i <= 8; i++) {
          academicHistory[i] = i === semester ? importedStudent.marks : null;
        }
        const newStudent: FullStudentProfile = {
          ...importedStudent,
          id: importedStudent.enrollmentNo,
          totalMarks: newTotalMarks,
          grade: getGrade(newTotalMarks, totalMaxMarks),
          academicHistory,
          sports: [],
          extracurricular: [],
          accounts: {
            collegeFeeDue: false,
            isHostelResident: false,
            hostelFeeDue: false,
          },
          library: [],
        };
        studentMap.set(newStudent.enrollmentNo, newStudent);
      }
    });

    const updatedStudents = Array.from(studentMap.values());
    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(batch, department.name, updatedStudents);
  };


  const handleSelectBatch = (batch: string) => {
    if (batch === selectedBatch) {
      setSelectedBatch(null);
      setSelectedYear(null);
      setSelectedSemester(null);
      setPerformanceData(null);
      setSelectedDepartmentId(null);
      setActiveAcademicDepartmentId(null);
    } else {
      setSelectedBatch(batch);
      setSelectedYear(null);
      setSelectedSemester(null);
      setPerformanceData(null);
    }
  };

  const handleAddBatch = (batch: string) => {
    setBatches(prevBatches => {
      if (prevBatches.includes(batch)) {
        return prevBatches;
      }
      return [...prevBatches, batch].sort();
    });
    setSelectedBatch(batch);
    setSelectedYear(null);
    setSelectedSemester(null);
    setPerformanceData(null);
  };

  const handleRemoveBatch = (batchToRemove: string) => {
    setBatches(prevBatches => prevBatches.filter(b => b !== batchToRemove));
    if (selectedBatch === batchToRemove) {
      setSelectedBatch(null);
      setSelectedYear(null);
      setSelectedSemester(null);
      setPerformanceData(null);
    }
  };

  const handleModifyBatch = (oldBatch: string, newBatch: string) => {
    if (!newBatch || newBatch === oldBatch) return;

    setBatches(prevBatches => {
      if (prevBatches.includes(newBatch)) {
        return prevBatches;
      }
      return prevBatches.map((b) => (b === oldBatch ? newBatch : b)).sort();
    });

    if (selectedBatch === oldBatch) {
      setSelectedBatch(newBatch);
    }
  };


  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setSelectedSemester(null);
    setPerformanceData(null);
  };

  const handleSelectSemester = (semester: number) => {
    setSelectedSemester(semester);
  };

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartmentId(department.id);
    if (department.id !== 'library') {
      setActiveAcademicDepartmentId(department.id);
    }
  };

  const handleViewStudent = (student: FullStudentProfile) => {
    const fullProfile = allStudents.find(s => s.id === student.id) || student;
    setViewingStudent(fullProfile);
  };

  const handleCloseStudentView = () => {
    setViewingStudent(null);
  };

  const handleUpdateStudentProfile = (updatedProfile: FullStudentProfile) => {
    if (!selectedBatch || !activeAcademicDepartment) return;
    const batch = selectedBatch;
    const department = activeAcademicDepartment;

    const updatedStudents = allStudents.map(s =>
      s.id === updatedProfile.id ? updatedProfile : s
    );
    setAllStudents(updatedStudents);
    updateStudentsForBatchDept(batch, department.name, updatedStudents);

    if (viewingStudent?.id === updatedProfile.id) {
      setViewingStudent(updatedProfile);
    }
  };

  const isLibraryView = selectedDepartment?.id === 'library';



  if (!user) {
    return isSignup ? (
      <Signup onSwitchToLogin={() => setIsSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setIsSignup(true)} />
    );
  }

  return (
    <div className="text-slate-800 min-h-screen font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex justify-end items-center">
        <span className="text-sm text-slate-600 mr-4">Welcome, {user.username}</span>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </div>
      <Header />
      <main className="container mx-auto p-4 md:p-6 space-y-6 pb-24">
        <BatchSelector
          batches={batches}
          selectedBatch={selectedBatch}
          onSelectBatch={handleSelectBatch}
          onAddBatch={handleAddBatch}
          onRemoveBatch={handleRemoveBatch}
          onModifyBatch={handleModifyBatch}
        />

        {selectedBatch && (
          <div className={`grid grid-cols-1 ${!isLibraryView ? 'lg:grid-cols-3' : ''} gap-6 animate-fade-in`}>
            {!isLibraryView && (
              <div className="lg:col-span-1 space-y-6">
                <SemesterSelector
                  years={YEARS}
                  selectedYear={selectedYear}
                  onSelectYear={handleSelectYear}
                  selectedSemester={selectedSemester}
                  onSelectSemester={handleSelectSemester}
                />

                {/* Failed Students Tab Navigation */}
                {selectedSemester && activeAcademicDepartment && (
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-3">View Options</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-left transition-colors ${activeTab === 'all' ? 'bg-brand-primary text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        All Students
                      </button>
                      <button
                        onClick={() => setActiveTab('failed')}
                        className={`px-4 py-2 rounded-lg text-left transition-colors ${activeTab === 'failed' ? 'bg-red-600 text-white font-bold' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                      >
                        Failed Students List
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className={!isLibraryView ? "lg:col-span-2" : ""}>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 min-h-[550px]">
                {isLibraryView ? (
                  activeAcademicDepartment ? (
                    <LibraryDisplay
                      students={allStudents}
                      isLoading={isLoading}
                      department={activeAcademicDepartment}
                      onUpdateStudentProfile={handleUpdateStudentProfile}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <h3 className="mt-2 text-lg font-medium text-slate-600">
                          Select a Department
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Please select an academic department first to view its library records.
                        </p>
                      </div>
                    </div>
                  )
                ) : selectedSemester && activeAcademicDepartment ? (
                  <PerformanceDisplay
                    data={activeTab === 'failed' && performanceData ? {
                      ...performanceData,
                      students: performanceData.students.filter(s =>
                        (s.marks || []).some(sub => sub.grade === 'F')
                      )
                    } : performanceData}
                    isLoading={isLoading}
                    semester={selectedSemester}
                    department={activeAcademicDepartment}
                    subjects={subjects}
                    onUpdateStudent={handleUpdateStudent}
                    onAddStudent={handleAddStudent}
                    onDeleteStudent={handleDeleteStudent}
                    onViewStudent={handleViewStudent}
                    onImportStudents={handleImportStudents}
                    onManageSubjects={() => setIsSubjectModalOpen(true)}
                    isFailedView={activeTab === 'failed'}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto h-12 w-12 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-slate-600">
                        Awaiting Selection
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Please select a semester and a department to view the
                        analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <DepartmentTabs
        departments={DEPARTMENTS}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={handleSelectDepartment}
      />
      <Footer />
      {viewingStudent && (
        <StudentReportModal
          student={viewingStudent}
          onClose={handleCloseStudentView}
          onSave={handleUpdateStudentProfile}
        />
      )}
      {isSubjectModalOpen && activeAcademicDepartment && selectedSemester && (
        <SubjectManagerModal
          isOpen={isSubjectModalOpen}
          onClose={() => setIsSubjectModalOpen(false)}
          initialSubjects={subjects}
          onSave={handleUpdateSubjects}
          departmentName={activeAcademicDepartment.name}
          semester={selectedSemester}
        />
      )}
    </div>
  );
}

export default App;