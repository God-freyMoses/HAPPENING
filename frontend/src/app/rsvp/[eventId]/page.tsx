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
  const [amount, setAmount] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [processingContribution, setProcessingContribution] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventId = params.eventId as string;

        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:5000/api/events/public/${eventId}`);
        setEvent(eventResponse.data);

        // Find guest by phone from URL
        const urlParams = new URLSearchParams(window.location.search);
        const phone = urlParams.get('phone');

        if (phone) {
          try {
            const guestResponse = await axios.get(`http://localhost:5000/api/guests/public/${eventId}?phone=${phone}`);
            setGuest(guestResponse.data);
            setRsvpStatus(guestResponse.data.rsvpStatus || 'pending');
            setContributorName(guestResponse.data.name);
          } catch (error) {
            console.error('Guest not found', error);
            setMessage('Guest not found. Please check your invitation link.');
          }
        } else {
          setMessage('Invalid invitation link. Phone number is required.');
        }
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
  }, [params.eventId]);

  const handleRSVP = async () => {
    if (!rsvpStatus || !guest) return;

    setSubmitting(true);
    try {
      // Update guest RSVP using public endpoint
      await axios.put(`http://localhost:5000/api/guests/public/${guest._id}`, {
        rsvpStatus: rsvpStatus
      });

      setMessage('Thank you for your RSVP! Your response has been updated.');
    } catch (error) {
      console.error('Failed to submit RSVP', error);
      setMessage('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!amount || !contributorName || !event) return;

    const contributionAmount = parseFloat(amount);
    if (contributionAmount <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }

    setProcessingContribution(true);
    try {
      // Create payment intent
      const response = await axios.post('http://localhost:5000/api/contributions/create-payment-intent', {
        amount: contributionAmount,
        eventId: event._id,
        contributorName: contributorName
      });

      const { clientSecret } = response.data;

      // For demo purposes, simulate successful payment
      setTimeout(async () => {
        try {
          await axios.post('http://localhost:5000/api/contributions', {
            eventId: event._id,
            contributorName: contributorName,
            amount: contributionAmount,
            status: 'completed'
          });
          setMessage(`Thank you ${contributorName}! Your contribution of R${contributionAmount} has been received.`);
          setAmount('');
          setProcessingContribution(false);
        } catch (error) {
          console.error('Failed to record contribution', error);
          setMessage('Payment processed, but failed to record contribution. Please contact organizer.');
          setProcessingContribution(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to process contribution', error);
      setMessage('Failed to process contribution. Please try again.');
      setProcessingContribution(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-black-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black-900">Event Not Found</h1>
          <p className="mt-2 text-black-600">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black-900 mb-2">You're Invited!</h1>
          <p className="text-lg text-black-600">Please RSVP to {event.title}</p>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-black-900 mb-2">{event.title}</h2>
            <p className="text-black-600 capitalize">{event.category} Event</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-semibold text-black-900">Date & Time</div>
              <div className="text-black-600">{new Date(event.date).toLocaleDateString()}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-semibold text-black-900">Location</div>
              <div className="text-black-600">{event.location}</div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black-900 mb-2">Funding Progress</h3>
            <div className="bg-black-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${event.fundingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-black-600 mt-2 text-center">
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
          <h3 className="text-2xl font-bold text-black-900 mb-6 text-center">Will you attend?</h3>

          {guest ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-black-600">Hi <span className="font-semibold">{guest.name}</span>!</p>
                <p className="text-sm text-black-900 mt-1">Please let us know if you can make it</p>
              </div>

              <div className="flex justify-center space-x-4">
                {['yes', 'maybe', 'no'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setRsvpStatus(status)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      rsvpStatus === status
                        ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                        : 'bg-black-100 text-black-700 hover:bg-black-200'
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
              <p className="text-black-600 mb-4">
                To RSVP, please contact the event organizer directly.
              </p>
              <p className="text-sm text-black-900">
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

        {/* Contribution Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-black-900 mb-6 text-center">Make a Contribution (Optional)</h3>

          <div className="space-y-6">
            {/* Contributor Name */}
            <div>
              <label className="block text-sm font-medium text-black-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                className="w-full px-4 py-3 border border-black-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Suggested Amounts */}
            <div>
              <label className="block text-sm font-medium text-black-700 mb-3">
                Suggested Amounts
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[50, 100, 200, 500].map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      amount === suggestedAmount.toString()
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-black-300 hover:border-green-400 text-black-700'
                    }`}
                  >
                    R{suggestedAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-black-700 mb-2">
                Or Enter Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black-900">R</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-black-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleContribute}
                disabled={processingContribution || !amount || !contributorName}
                className="w-full bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {processingContribution ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Contribute R${amount || '0'}`
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="text-center text-sm text-black-900">
              <p>🔒 Secure payment processing powered by Stripe</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-black-900 text-sm">
          <p>Powered by Happening Event Planner</p>
        </div>
      </div>
    </div>
  );
}