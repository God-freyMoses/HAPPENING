'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Template {
  _id: string;
  name: string;
  type: string;
  description: string;
  tasks: Array<{
    description: string;
    status: string;
  }>;
  isDefault: boolean;
}

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    budgetGoal: '',
    location: '',
    category: 'Birthday'
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if a template was selected
    const templateId = localStorage.getItem('selectedTemplateId');
    const templateName = localStorage.getItem('selectedTemplateName');

    if (templateId && templateName) {
      setSelectedTemplate({ _id: templateId, name: templateName } as Template);

      // Clear the stored template data
      localStorage.removeItem('selectedTemplateId');
      localStorage.removeItem('selectedTemplateName');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const eventData = selectedTemplate ?
        { ...formData, templateId: selectedTemplate._id } :
        formData;

      const response = await axios.post('http://localhost:5000/api/events', eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Show success message with task count
      const taskCount = response.data.tasks?.length || 0;
      const templateMessage = selectedTemplate ? ` using ${selectedTemplate.name} template` : '';
      alert(`Event created successfully${templateMessage}! ${taskCount} tasks have been generated for you.`);

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create event', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/templates')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Choose Template
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 text-sm">
                    Using template: <strong>{selectedTemplate.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Event Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="budgetGoal" className="block text-sm font-medium text-gray-700">
                  Budget Goal (R)
                </label>
                <input
                  type="number"
                  name="budgetGoal"
                  id="budgetGoal"
                  required
                  min="0"
                  step="0.01"
                  value={formData.budgetGoal}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  name="category"
                  id="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Funeral">Funeral</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}