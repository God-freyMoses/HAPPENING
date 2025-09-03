'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  budgetGoal: number;
  fundingProgress: number;
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  rsvpStatus: string;
}

export default function RSVP() {
  const [event, setEvent] = useState<Event | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventId = params.eventId as string;

        // Check if guest is authenticated
        const guestToken = localStorage.getItem('guestToken');
        const guestUser = localStorage.getItem('guestUser');

        if (guestToken && guestUser) {
          const user = JSON.parse(guestUser);
          if (user.eventId === eventId) {
            // Guest is authenticated for this event
            setGuest(user);
            setRsvpStatus(user.rsvpStatus || 'pending');
          } else {
            // Wrong event, redirect to login
            router.push(`/guest/login?eventId=${eventId}`);
            return;
          }
        } else {
          // Not authenticated, redirect to login
          router.push(`/guest/login?eventId=${eventId}`);
          return;
        }

        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:5000/api/events/public/${eventId}`);
        setEvent(eventResponse.data);
      } catch (error) {
        console.error('Failed to fetch event data', error);
        setMessage('Event not found or no longer available.');
      } finally {
        setLoading(false);
      }
    };

    if (params.eventId) {
      fetchEventData();
    }
  }, [params.eventId, router]);

  const handleRSVP = async () => {
    if (!rsvpStatus) return;

    setSubmitting(true);
    try {
      const guestToken = localStorage.getItem('guestToken');
      if (!guestToken) {
        router.push(`/guest/login?eventId=${params.eventId}`);
        return;
      }

      // Update guest RSVP using authenticated endpoint
      await axios.put(`http://localhost:5000/api/guests/public/${guest?._id}`, {
        rsvpStatus: rsvpStatus
      }, {
        headers: { Authorization: `Bearer ${guestToken}` }
      });

      setMessage('Thank you for your RSVP! Your response has been updated.');
    } catch (error) {
      console.error('Failed to submit RSVP', error);
      setMessage('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
          <p className="mt-2 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-lg text-gray-600">Please RSVP to {event.title}</p>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
            <p className="text-gray-600 capitalize">{event.category} Event</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-semibold text-gray-900">Date & Time</div>
              <div className="text-gray-600">{new Date(event.date).toLocaleDateString()}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-semibold text-gray-900">Location</div>
              <div className="text-gray-600">{event.location}</div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding Progress</h3>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${event.fundingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {event.fundingProgress}% of R{event.budgetGoal} goal reached
            </p>
            <div className="text-center mt-3">
              <a
                href={`/contribute/${event._id}${guest ? `?phone=${guest.phone}` : ''}`}
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                💝 Make a Contribution
              </a>
            </div>
          </div>
        </div>

        {/* RSVP Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Will you attend?</h3>

          {guest ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">Hi <span className="font-semibold">{guest.name}</span>!</p>
                <p className="text-sm text-gray-500 mt-1">Please let us know if you can make it</p>
              </div>

              <div className="flex justify-center space-x-4">
                {['yes', 'maybe', 'no'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setRsvpStatus(status)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      rsvpStatus === status
                        ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'yes' ? '✅ Yes, I\'ll be there' :
                     status === 'maybe' ? '🤔 Maybe' :
                     '❌ Sorry, I can\'t make it'}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleRSVP}
                  disabled={submitting || !rsvpStatus}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit RSVP'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                To RSVP, please contact the event organizer directly.
              </p>
              <p className="text-sm text-gray-500">
                This RSVP link may not be properly configured yet.
              </p>
            </div>
          )}

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              message.includes('Thank you')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Happening Event Planner</p>
        </div>
      </div>
    </div>
  );
}