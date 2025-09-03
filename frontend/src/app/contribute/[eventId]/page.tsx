'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
}

export default function Contribute() {
  const [event, setEvent] = useState<Event | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [amount, setAmount] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const params = useParams();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventId = params.eventId as string;

        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:5000/api/events/public/${eventId}`);
        setEvent(eventResponse.data);

        // Try to find guest by phone number from URL
        const urlParams = new URLSearchParams(window.location.search);
        const phone = urlParams.get('phone');

        if (phone) {
          try {
            const guestResponse = await axios.get(`http://localhost:5000/api/guests/public/${eventId}?phone=${phone}`);
            setGuest(guestResponse.data);
            setContributorName(guestResponse.data.name);
          } catch (error) {
            // Guest not found
            setGuest(null);
          }
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

  const handleContribute = async () => {
    if (!amount || !contributorName || !event) return;

    const contributionAmount = parseFloat(amount);
    if (contributionAmount <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }

    setProcessing(true);
    try {
      // Create payment intent
      const response = await axios.post('http://localhost:5000/api/contributions/create-payment-intent', {
        amount: contributionAmount,
        eventId: event._id,
        contributorName: contributorName
      });

      const { clientSecret } = response.data;

      // For demo purposes, simulate successful payment
      // In production, you would integrate with Stripe Elements
      setTimeout(() => {
        // Simulate payment success
        setMessage(`Thank you ${contributorName}! Your contribution of R${contributionAmount} has been received.`);
        setAmount('');
        setProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to process contribution', error);
      setMessage('Failed to process contribution. Please try again.');
      setProcessing(false);
    }
  };

  const suggestedAmounts = [50, 100, 200, 500];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contribution page...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Make a Contribution</h1>
          <p className="text-lg text-gray-600">Help make {event.title} even more special</p>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
            <p className="text-gray-600 capitalize">{event.category} Event</p>
            <p className="text-sm text-gray-500 mt-2">
              📅 {new Date(event.date).toLocaleDateString()} • 📍 {event.location}
            </p>
          </div>

          {/* Funding Progress */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Funding Progress</h3>
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${event.fundingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {event.fundingProgress}% of R{event.budgetGoal} goal reached
            </p>
          </div>
        </div>

        {/* Contribution Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Contribution</h3>

          <div className="space-y-6">
            {/* Contributor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Suggested Amounts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Suggested Amounts
              </label>
              <div className="grid grid-cols-2 gap-3">
                {suggestedAmounts.map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      amount === suggestedAmount.toString()
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400 text-gray-700'
                    }`}
                  >
                    R{suggestedAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                disabled={processing || !amount || !contributorName}
                className="w-full bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {processing ? (
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
            <div className="text-center text-sm text-gray-500">
              <p>🔒 Secure payment processing powered by Stripe</p>
            </div>
          </div>

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