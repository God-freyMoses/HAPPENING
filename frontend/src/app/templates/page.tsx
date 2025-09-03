'use client';

import { useEffect, useState } from 'react';
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

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    eventType: ''
  });
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user templates
        const userTemplatesResponse = await axios.get('http://localhost:5000/api/templates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTemplates(userTemplatesResponse.data);

        // Fetch default templates
        const defaultTemplatesResponse = await axios.get('http://localhost:5000/api/templates/defaults');
        setDefaultTemplates(defaultTemplatesResponse.data);

      } catch (error) {
        console.error('Failed to fetch templates', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [router]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.post('http://localhost:5000/api/templates/generate', newTemplate, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh templates
      const response = await axios.get('http://localhost:5000/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);

      setNewTemplate({ name: '', description: '', eventType: '' });
      setShowCreateForm(false);
      alert('Template created successfully!');
    } catch (error) {
      console.error('Failed to create template', error);
      alert('Failed to create template. Please try again.');
    }
  };

  const handleUseTemplate = (template: Template) => {
    // Store template ID in localStorage to use in create event
    localStorage.setItem('selectedTemplateId', template._id);
    localStorage.setItem('selectedTemplateName', template.name);
    router.push('/create-event');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Event Templates</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {showCreateForm ? 'Cancel' : 'Create Custom Template'}
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
          {showCreateForm && (
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Create Custom Template</h2>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <input
                    type="text"
                    value={newTemplate.eventType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, eventType: e.target.value })}
                    placeholder="e.g., Wedding, Graduation, Corporate Event"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Describe the event and any special requirements..."
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Generate Template with AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Default Templates */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Default Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {defaultTemplates.map((template) => (
                <div key={template.name} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                    <p className="mt-2 text-sm text-gray-500">{template.tasks.length} tasks included</p>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Use This Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Templates */}
          {templates.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Custom Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template._id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                      <p className="mt-2 text-sm text-gray-500">{template.tasks.length} tasks included</p>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                        >
                          Use Template
                        </button>
                        <button className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}