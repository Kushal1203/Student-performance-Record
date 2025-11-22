import { FullStudentProfile, Subject } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const getStudentsForBatchDept = async (
  department: string,
  batch: string
): Promise<FullStudentProfile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/students?batch=${encodeURIComponent(batch)}&department=${encodeURIComponent(department)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const updateStudentsForBatchDept = async (
  batch: string,
  department: string,
  students: FullStudentProfile[]
): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batch, department, students }),
    });
  } catch (error) {
    console.error('Error saving students:', error);
  }
};

export const getSubjectsForDeptSem = async (departmentId: string, semester: number): Promise<Subject[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects?department=${encodeURIComponent(departmentId)}&semester=${semester}`);
    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

export const updateSubjectsForDeptSem = async (departmentId: string, semester: number, subjects: Subject[]): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ department: departmentId, semester, subjects }),
    });
  } catch (error) {
    console.error('Error saving subjects:', error);
  }
};
