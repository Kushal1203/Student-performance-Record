import React, { useState, useRef, useEffect } from 'react';

// --- Sub-components moved outside for stability and best practices ---

interface ActionButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className: string;
  label: string;
  type?: 'submit' | 'button' | 'reset';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, children, className, label, type = 'button' }) => (
    <button onClick={onClick} type={type} className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${className}`} aria-label={label}>
        {children}
    </button>
);


interface BatchFormProps {
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    startYear: string;
    setStartYear: (value: string) => void;
    isEditing: boolean;
}

const BatchForm: React.FC<BatchFormProps> = ({ onSubmit, onCancel, startYear, setStartYear, isEditing }) => {
    const startYearInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (startYearInputRef.current) {
            startYearInputRef.current.focus();
            startYearInputRef.current.select();
        }
    }, []);

    const calculateEndYear = (start: string) => {
        const startNum = parseInt(start, 10);
        if (!isNaN(startNum) && start.length === 4) {
          return (startNum + 4).toString();
        }
        return '';
    }
    
    const endYear = calculateEndYear(startYear);

    return (
        <form onSubmit={onSubmit} className="flex flex-grow items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <div className="flex items-center gap-2">
                <input
                    ref={startYearInputRef}
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="Start Year"
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm w-28 focus:ring-brand-primary focus:border-brand-primary"
                />
                <span className="text-slate-500">-</span>
                <input
                    type="number"
                    value={endYear}
                    readOnly
                    placeholder="End Year"
                    className="bg-slate-200 border border-slate-300 rounded-lg px-3 py-2 text-sm w-28 text-slate-500 cursor-not-allowed"
                />
            </div>
            <ActionButton type="submit" className="bg-emerald-600 hover:bg-emerald-500" label={isEditing ? "Save changes" : "Save new batch"}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </ActionButton>
            <ActionButton onClick={onCancel} type="button" className="bg-slate-600 hover:bg-slate-500" label="Cancel">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </ActionButton>
        </form>
    );
}

// --- Main Component ---

interface BatchSelectorProps {
  batches: string[];
  selectedBatch: string | null;
  onSelectBatch: (batch: string) => void;
  onAddBatch: (batch: string) => void;
  onRemoveBatch: (batch: string) => void;
  onModifyBatch: (oldBatch: string, newBatch: string) => void;
}

const BatchSelector: React.FC<BatchSelectorProps> = ({
  batches,
  selectedBatch,
  onSelectBatch,
  onAddBatch,
  onRemoveBatch,
  onModifyBatch,
}) => {
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  
  const [newStartYear, setNewStartYear] = useState('');
  const [editingStartYear, setEditingStartYear] = useState('');
  
  const validateYears = (startStr: string, isEditing: boolean, oldBatch?: string): string | null => {
    const startYear = parseInt(startStr, 10);
    if (isNaN(startYear) || startStr.length !== 4) {
      alert("Invalid format. Please enter a 4-digit starting year.");
      return null;
    }

    const endYear = startYear + 4;
    const newBatch = `${startYear}-${endYear}`;

    if (!isEditing && batches.includes(newBatch)) {
      alert('This batch already exists.');
      return null;
    }
    
    if (isEditing && newBatch !== oldBatch && batches.includes(newBatch)) {
      alert('Another batch with this year range already exists.');
      return null;
    }

    return newBatch;
  };

  const handleAddNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch = validateYears(newStartYear, false);
    if (newBatch) {
      onAddBatch(newBatch);
      handleCancel();
    }
  };

  const handleStartEditing = (batch: string) => {
    const [start] = batch.split('-');
    setEditingBatch(batch);
    setEditingStartYear(start);
    setMode('edit');
  };
  
  const handleSaveModifiedBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (editingStartYear === editingBatch.split('-')[0]) {
        handleCancel();
        return;
    }
    const newBatch = validateYears(editingStartYear, true, editingBatch);
    if (newBatch) {
      onModifyBatch(editingBatch, newBatch);
    }
    handleCancel();
  };

  const handleCancel = () => {
    setMode('view');
    setEditingBatch(null);
    setNewStartYear('');
    setEditingStartYear('');
  };

  const handleRemove = (batch: string) => {
    if (window.confirm(`Are you sure you want to remove batch ${batch}? This action cannot be undone.`)) {
      onRemoveBatch(batch);
    }
  };
  
  const handleStartAdding = () => {
      setMode('add');
      const currentYear = new Date().getFullYear();
      setNewStartYear(currentYear.toString());
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Academic Batches
        </h2>
        {mode === 'view' && (
          <button
            onClick={handleStartAdding}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-emerald-500 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Batch
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {mode === 'add' && (
            <BatchForm 
                onSubmit={handleAddNewBatch}
                onCancel={handleCancel}
                startYear={newStartYear}
                setStartYear={setNewStartYear}
                isEditing={false}
            />
        )}
        
        {batches.map((batch) => (
            <div key={batch}>
            {mode === 'edit' && editingBatch === batch ? (
                <BatchForm
                    onSubmit={handleSaveModifiedBatch}
                    onCancel={handleCancel}
                    startYear={editingStartYear}
                    setStartYear={setEditingStartYear}
                    isEditing={true}
                />
            ) : (
                <div className="flex items-center justify-between gap-2 bg-slate-100 p-2 rounded-lg">
                    <button
                        onClick={() => onSelectBatch(batch)}
                        className={`w-full text-left pl-4 pr-4 py-2 rounded-lg text-base font-bold transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-primary ${ selectedBatch === batch ? 'bg-gradient-to-r from-brand-primary to-sky-400 text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                    >
                        Batch {batch}
                    </button>
                    <div className="flex items-center space-x-2">
                        <ActionButton onClick={() => handleStartEditing(batch)} className="bg-blue-500 hover:bg-blue-400" label={`Modify batch ${batch}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        </ActionButton>
                        <ActionButton onClick={() => handleRemove(batch)} className="bg-red-500 hover:bg-red-400" label={`Remove batch ${batch}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </ActionButton>
                    </div>
                </div>
            )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default BatchSelector;