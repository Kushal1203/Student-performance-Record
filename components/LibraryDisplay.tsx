import React, { useState } from 'react';
import { FullStudentProfile, LibraryRecord, Department } from '../types';

interface LibraryDisplayProps {
    students: FullStudentProfile[];
    isLoading: boolean;
    department: Department;
    onUpdateStudentProfile: (profile: FullStudentProfile) => void;
}

const LibraryDisplay: React.FC<LibraryDisplayProps> = ({ students, isLoading, department, onUpdateStudentProfile }) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [addingRecordFor, setAddingRecordFor] = useState<string | null>(null);
    const [newRecord, setNewRecord] = useState({ bookName: '', bookCode: '', issueDate: new Date().toISOString().split('T')[0] });

    const toggleRowExpansion = (studentId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
                setAddingRecordFor(null);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleAddRecord = (student: FullStudentProfile) => {
        if (!newRecord.bookName.trim() || !newRecord.bookCode.trim()) {
            alert("Book Name and Book Code cannot be empty.");
            return;
        }
        
        const updatedProfile = JSON.parse(JSON.stringify(student));
        const newLibraryRecord: LibraryRecord = {
            id: crypto.randomUUID(),
            ...newRecord,
            isReturned: false,
        };
        updatedProfile.library.push(newLibraryRecord);
        onUpdateStudentProfile(updatedProfile);

        setAddingRecordFor(null);
        setNewRecord({ bookName: '', bookCode: '', issueDate: new Date().toISOString().split('T')[0] });
    };

    const handleToggleReturn = (student: FullStudentProfile, recordId: string) => {
        const updatedProfile = JSON.parse(JSON.stringify(student));
        const recordIndex = updatedProfile.library.findIndex((r: LibraryRecord) => r.id === recordId);
        if (recordIndex > -1) {
            const record = updatedProfile.library[recordIndex];
            record.isReturned = !record.isReturned;
            record.returnDate = record.isReturned ? new Date().toISOString().split('T')[0] : undefined;
            onUpdateStudentProfile(updatedProfile);
        }
    };
    
    const handleDeleteRecord = (student: FullStudentProfile, recordId: string) => {
        if(window.confirm("Are you sure you want to delete this library record? This cannot be undone.")){
            const updatedProfile = JSON.parse(JSON.stringify(student));
            updatedProfile.library = updatedProfile.library.filter((r: LibraryRecord) => r.id !== recordId);
            onUpdateStudentProfile(updatedProfile);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
                Library Records - {department.name}
            </h2>
            <div className="overflow-auto max-h-[480px]">
                <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="sticky top-0 bg-white/80 backdrop-blur-sm text-slate-600 font-semibold">
                        <tr className="border-b border-slate-200">
                            <th className="p-3">S.No</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Enrollment No</th>
                            <th className="p-3 text-center">Books Due</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&>tr:not(.bg-slate-50):nth-child(even)]:bg-slate-100/50">
                        {students.map((student, index) => {
                            const booksDue = student.library ? student.library.filter(r => !r.isReturned).length : 0;
                            return (
                                <React.Fragment key={student.id}>
                                    <tr className="border-b border-slate-200">
                                        <td className="p-3 text-slate-600 text-center">{index + 1}</td>
                                        <td className="p-3 text-slate-800 font-medium">{student.name}</td>
                                        <td className="p-3 text-slate-600 font-mono">{student.enrollmentNo}</td>
                                        <td className={`p-3 text-center font-bold ${booksDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{booksDue}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => toggleRowExpansion(student.id)} className="px-3 py-1 text-xs rounded-md bg-indigo-600 hover:bg-indigo-500 text-white">
                                                {expandedRows.has(student.id) ? 'Hide Books' : 'Manage Books'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.has(student.id) && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-slate-800 text-base">Book Records for {student.name}</h4>
                                                        {addingRecordFor !== student.id && (
                                                          <button onClick={() => setAddingRecordFor(student.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                            Add Book
                                                          </button>
                                                        )}
                                                    </div>
                                                    
                                                    {addingRecordFor === student.id && (
                                                        <div className="p-3 bg-emerald-500/10 rounded-lg space-y-2">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                <input type="text" placeholder="Book Name" value={newRecord.bookName} onChange={e => setNewRecord(p => ({ ...p, bookName: e.target.value }))} className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                                                                <input type="text" placeholder="Book Code" value={newRecord.bookCode} onChange={e => setNewRecord(p => ({ ...p, bookCode: e.target.value }))} className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                                                                <input type="date" placeholder="Issue Date" value={newRecord.issueDate} onChange={e => setNewRecord(p => ({ ...p, issueDate: e.target.value }))} className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setAddingRecordFor(null)} className="px-2 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-800">Cancel</button>
                                                                <button onClick={() => handleAddRecord(student)} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Save Record</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(student.library && student.library.length > 0) ? (
                                                        <table className="w-full text-xs">
                                                            <thead className="text-slate-500">
                                                                <tr className="border-b-2 border-slate-200">
                                                                    <th className="p-1.5 text-left">Book Name / Code</th>
                                                                    <th className="p-1.5 text-center">Issue Date</th>
                                                                    <th className="p-1.5 text-center">Return Date</th>
                                                                    <th className="p-1.5 text-center">Status</th>
                                                                    <th className="p-1.5 text-center">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {student.library.map(record => (
                                                                    <tr key={record.id} className="border-b border-slate-200 last:border-b-0">
                                                                        <td className="p-1.5"><span className="font-semibold text-slate-700">{record.bookName}</span><br/><span className="font-mono text-slate-500">{record.bookCode}</span></td>
                                                                        <td className="p-1.5 text-center">{new Date(record.issueDate).toLocaleDateString()}</td>
                                                                        <td className="p-1.5 text-center">{record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}</td>
                                                                        <td className="p-1.5 text-center">
                                                                            <button onClick={() => handleToggleReturn(student, record.id)} className={`px-2 py-0.5 font-bold rounded-full ${record.isReturned ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                                                                {record.isReturned ? 'Returned' : 'Not Returned'}
                                                                            </button>
                                                                        </td>
                                                                        <td className="p-1.5 text-center">
                                                                            <button onClick={() => handleDeleteRecord(student, record.id)} className="p-1 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10" title="Delete record"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-slate-500 text-center py-4 text-sm italic">No book records for this student.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-slate-500">
                                    No students found for this department and batch.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LibraryDisplay;