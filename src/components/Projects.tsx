import React, { useMemo, useState } from 'react';
import { useDb } from '../context/DbContext';
import type { Project } from '../types';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProjectsProps {
  onOpenProject: (projectId: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onOpenProject }) => {
  const { projects, addProject, deleteProject } = useDb();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [error, setError] = useState<string | null>(null);

  const projectSummaries = useMemo(() => {
    return projects.map((project) => {
      const totalIncome = project.incomes.reduce((acc, entry) => acc + entry.amount, 0);
      const totalExpense = project.expenditures.reduce((acc, entry) => acc + entry.amount, 0);
      const costPerBeneficiary = project.beneficiaries > 0 ? totalExpense / project.beneficiaries : 0;
      return {
        ...project,
        totalIncome,
        totalExpense,
        costPerBeneficiary,
      };
    });
  }, [projects]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
  };

  const handleOpenModal = () => {
    setTitle('');
    setDescription('');
    setBeneficiaries('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !beneficiaries.trim()) {
      setError('All fields are required.');
      return;
    }

    const parsedBeneficiaries = Number(beneficiaries);
    if (Number.isNaN(parsedBeneficiaries) || parsedBeneficiaries <= 0) {
      setError('Beneficiaries must be a positive number.');
      return;
    }

    try {
      await addProject({ title: title.trim(), description: description.trim(), beneficiaries: parsedBeneficiaries });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Unable to add project');
    }
  };

  const handleConfirmDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setDeleteConfirmProjectId(null);
    } catch (err: any) {
      console.error('Unable to delete project:', err);
      setDeleteConfirmProjectId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage projects, track income and expenses, and keep beneficiary costs visible.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/95"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projectSummaries.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">No projects created yet.</p>
          </div>
        ) : (
          projectSummaries.map((project) => (
            <div key={project.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{project.description}</p>
                </div>
                <button onClick={() => setDeleteConfirmProjectId(project.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Beneficiaries</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{project.beneficiaries}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Income</p>
                    <p className="mt-2 text-lg font-black text-emerald-700">{formatCurrency(project.totalIncome)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Expenses</p>
                    <p className="mt-2 text-lg font-black text-rose-700">{formatCurrency(project.totalExpense)}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Cost / beneficiary: <span className="font-bold text-slate-900">{formatCurrency(project.costPerBeneficiary)}</span></p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={() => onOpenProject(project.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  Open
                </button>
                <button
                  onClick={() => onOpenProject(project.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/95"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add New Project</h2>
                <p className="text-sm text-slate-500">Create a project and define its beneficiary base.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Total Beneficiaries</label>
                <input
                  type="number"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/95"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmProjectId)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteConfirmProjectId && handleConfirmDeleteProject(deleteConfirmProjectId)}
        onCancel={() => setDeleteConfirmProjectId(null)}
      />
    </div>
  );
};
