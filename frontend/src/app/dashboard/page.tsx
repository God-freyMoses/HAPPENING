'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Event {
  _id: string;
  title: string;
  date: string;
  category: string;
  status: string;
  fundingProgress: number;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events', error);
      }
    };

    fetchEvents();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div>
            <button
              onClick={() => router.push('/create-event')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mr-4"
            >
              Create Event
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.category}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Status: {event.status}</p>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${event.fundingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{event.fundingProgress}% funded</p>
                  </div>
                  <button
                    onClick={() => router.push(`/event/${event._id}`)}
                    className="mt-4 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}