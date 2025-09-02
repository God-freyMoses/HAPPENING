'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';

interface Event {
  _id: string;
  title: string;
  date: string;
  budgetGoal: number;
  location: string;
  category: string;
  status: string;
  fundingProgress: number;
}

interface Task {
  _id: string;
  description: string;
  status: string;
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  rsvpStatus: string;
}

export default function EventDetails() {
  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const eventId = params.id as string;

        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:5000/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvent(eventResponse.data);

        // Fetch tasks for this event
        const tasksResponse = await axios.get(`http://localhost:5000/api/tasks?eventId=${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(tasksResponse.data);

        // Fetch guests for this event
        const guestsResponse = await axios.get(`http://localhost:5000/api/guests?eventId=${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGuests(guestsResponse.data);

      } catch (error) {
        console.error('Failed to fetch event data', error);
        alert('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEventData();
    }
  }, [params.id, router]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const eventId = params.id as string;
      await axios.post('http://localhost:5000/api/tasks', {
        eventId,
        description: newTaskDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh tasks
      const tasksResponse = await axios.get(`http://localhost:5000/api/tasks?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasksResponse.data);

      setNewTaskDescription('');
      setShowAddTaskForm(false);
    } catch (error) {
      console.error('Failed to add task', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleTaskStatusChange = async (taskId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setTasks(tasks.map(task =>
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Failed to update task status', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name.trim() || !newGuest.phone.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const eventId = params.id as string;
      await axios.post('http://localhost:5000/api/guests', {
        eventId,
        ...newGuest
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh guests
      const guestsResponse = await axios.get(`http://localhost:5000/api/guests?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuests(guestsResponse.data);

      setNewGuest({ name: '', phone: '', email: '' });
      setShowAddGuestForm(false);
    } catch (error) {
      console.error('Failed to add guest', error);
      alert('Failed to add guest. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-600">{event.category} Event</p>
            </div>
            <div className="flex space-x-4">
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
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['details', 'tasks', 'guests'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{new Date(event.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-sm text-gray-900">{event.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Budget Goal</h3>
                  <p className="mt-1 text-sm text-gray-900">R{event.budgetGoal}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{event.status}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Funding Progress</h3>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${event.fundingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{event.fundingProgress}% funded</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <button
                  onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                >
                  {showAddTaskForm ? 'Cancel' : 'Add Task'}
                </button>
              </div>

              {showAddTaskForm && (
                <form onSubmit={handleAddTask} className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-gray-500">No tasks yet</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={() => handleTaskStatusChange(task._id, task.status)}
                          className="mr-3"
                        />
                        <span className={task.status === 'done' ? 'line-through text-gray-500' : ''}>
                          {task.description}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Guests</h2>
                <button
                  onClick={() => setShowAddGuestForm(!showAddGuestForm)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                >
                  {showAddGuestForm ? 'Cancel' : 'Add Guest'}
                </button>
              </div>

              {showAddGuestForm && (
                <form onSubmit={handleAddGuest} className="mb-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newGuest.name}
                      onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                      placeholder="Guest name"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <input
                      type="tel"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      placeholder="Phone number"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <input
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      placeholder="Email (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Guest
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {guests.length === 0 ? (
                  <p className="text-gray-500">No guests yet</p>
                ) : (
                  guests.map((guest) => (
                    <div key={guest._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{guest.name}</p>
                        <p className="text-sm text-gray-600">{guest.phone}</p>
                        {guest.email && <p className="text-sm text-gray-600">{guest.email}</p>}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        guest.rsvpStatus === 'yes' ? 'bg-green-100 text-green-800' :
                        guest.rsvpStatus === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                        guest.rsvpStatus === 'no' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {guest.rsvpStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}