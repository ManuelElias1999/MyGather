import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Calendar, MapPin, TrendingUp, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

interface Event {
  key: string;
  payloadText: string;
  attributes: any[];
}

interface ParsedEvent {
  title: string;
  city: string;
  startAt?: string;
  startAtISO?: string;
  category?: string;
  locationType?: string;
  capacity?: number;
  tags?: string[];
}

const API_BASE = 'https://etha-precarnival-sanford.ngrok-free.dev';

export default function DiscoverEvents() {
  const navigate = useNavigate();
  const [city, setCity] = useState('Buenos Aires');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/events?city=${encodeURIComponent(city)}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch events (${response.status}): ${text}`);
      }
      
      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Response is not JSON: ${text}`);
      }
      
      setEvents(data.events || []);
      setHasSearched(true);
      toast.success(`Found ${data.events?.length || 0} events in ${city}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseEventPayload = (payloadText: string): ParsedEvent | null => {
    try {
      return JSON.parse(payloadText);
    } catch {
      return null;
    }
  };

  const shortenKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  const formatDateTime = (event: ParsedEvent) => {
    const dateStr = event.startAtISO || event.startAt;
    if (!dateStr) return 'Date TBA';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date TBA';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Find your next event
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Discover amazing events stored as Arkiv entities. Immutable, transparent, and decentralized event data.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Section */}
        <div className="lg:col-span-2">
          {/* Search Card */}
          <Card className="mb-8 border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city name"
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && searchEvents()}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchEvents} 
                    disabled={loading || !city.trim()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="whitespace-pre-wrap break-words">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full mb-4 rounded-lg" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && hasSearched && events.length === 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No events found in {city}
                </h3>
                <p className="text-slate-600 mb-6">
                  Be the first to create an event in this city!
                </p>
                <Button onClick={() => navigate('/create')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create the first event
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Events Grid */}
          {!loading && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => {
                const parsed = parseEventPayload(event.payloadText);
                if (!parsed) return null;

                return (
                  <Card 
                    key={event.key}
                    className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/event/${event.key}`)}
                  >
                    <CardContent className="p-0">
                      {/* Cover Image Placeholder */}
                      <div className="h-40 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-t-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                        <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 border-0">
                          Upcoming
                        </Badge>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {parsed.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateTime(parsed)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span>{parsed.city}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {parsed.category && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">
                              {parsed.category}
                            </Badge>
                          )}
                          {parsed.tags?.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="border-slate-200">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <code className="text-xs text-slate-500 font-mono">
                            {shortenKey(event.key)}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            View details →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right/Secondary Section */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm sticky top-24">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Trending this week</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { title: 'Web3 Developer Meetup', city: 'San Francisco', category: 'meetup' },
                  { title: 'Blockchain Workshop', city: 'New York', category: 'workshop' },
                  { title: 'DeFi Conference 2026', city: 'London', category: 'conference' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-100 hover:border-blue-200 transition-colors"
                  >
                    <h4 className="font-medium text-slate-900 mb-1">{item.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{item.city}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-slate-700 border-0 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Powered by Arkiv entities</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
