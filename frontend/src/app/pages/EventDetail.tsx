import React from "react";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useWallet } from "../../hooks/useWallet";
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  UserCheck,
  ClipboardCheck,
  ArrowLeft,
  Copy,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:8787';

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

interface RSVP {
  key: string;
  payloadText: string;
}

interface ParsedRSVP {
  attendee: string;
  status: string;
  createdAt?: string;
}

interface Attendance {
  key: string;
  payloadText: string;
}

interface ParsedAttendance {
  attendee: string;
  checkedInAt?: string;
}

export default function EventDetail() {
  const { eventKey } = useParams<{ eventKey: string }>();
  const navigate = useNavigate();
  const { address } = useWallet();

  const [event, setEvent] = useState<ParsedEvent | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventKey) {
      loadEventData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey]);

  const loadEventData = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const url = `${API_BASE}/event?eventKey=${encodeURIComponent(eventKey!)}`;
      const eventResponse = await fetch(`${API_BASE}/event?eventKey=${encodeURIComponent(eventKey!)}`);
  
      const raw = await eventResponse.text();
  
      if (!eventResponse.ok) {
        throw new Error(`Failed to load event (${eventResponse.status}): ${raw}`);
      }
  
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Event response is not JSON: ${raw}`);
      }
  
      const payloadText = data?.event?.payloadText;
      if (!payloadText) throw new Error(`Event payload missing: ${raw}`);
  
      let parsedEvent: ParsedEvent;
      try {
        parsedEvent = JSON.parse(payloadText);
      } catch {
        throw new Error(`Event payloadText is not valid JSON: ${payloadText}`);
      }
  
      console.log("EVENT KEY:", eventKey);
      console.log("EVENT RAW:", data);
      console.log("EVENT PARSED:", parsedEvent);
  
      setEvent(parsedEvent);
  
      await Promise.all([loadRSVPs(), loadAttendance()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event';
      setError(errorMessage);
      toast.error(errorMessage);
  
      setEvent({
        title: 'Event Details',
        city: 'Unknown',
        category: 'event',
        locationType: 'in-person',
        capacity: 50,
        tags: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRSVPs = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/rsvps?eventKey=${encodeURIComponent(eventKey!)}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to load RSVPs (${response.status}): ${text}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setRsvps(data.rsvps || []);
      } catch {
        throw new Error(`RSVPs response is not JSON: ${text}`);
      }
    } catch (err) {
      console.error('Error loading RSVPs:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/attendance?eventKey=${encodeURIComponent(eventKey!)}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to load attendance (${response.status}): ${text}`);
      }

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setAttendance(data.attendance || []);
      } catch {
        throw new Error(`Attendance response is not JSON: ${text}`);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  const handleRSVP = async () => {
    if (!address) {
      toast.error("Connect wallet first");
      return;
    }
    setRsvpLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventKey,
          attendee: address,
          status: "going",
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to RSVP (${response.status}): ${text}`);
      }

      toast.success('RSVP submitted successfully!');
      await loadRSVPs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to RSVP';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!address) {
      toast.error("Connect wallet first");
      return;
    }
    setCheckinLoading(true);

    try {
      const response = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventKey: eventKey,
          attendee: address,
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to check in (${response.status}): ${text}`);
      }

      toast.success('Checked in successfully!');
      await loadAttendance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCheckinLoading(false);
    }
  };

  const parsePayload = (payloadText: string): any => {
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

  const shortenAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Date TBA';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date TBA';
    }
  };

  const copyEventKey = () => {
    if (eventKey) {
      navigator.clipboard.writeText(eventKey);
      toast.success('Event key copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="border-slate-200 mb-8">
          <CardContent className="p-8">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" onClick={() => navigate('/discover')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discover
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="whitespace-pre-wrap break-words">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-lg mb-8 bg-gradient-to-br from-white to-blue-50">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {event?.title || 'Event Details'}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Date & Time</p>
                    <p className="font-medium">
                      {formatDateTime(event?.startAtISO || event?.startAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">City</p>
                    <p className="font-medium">{event?.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Capacity</p>
                    <p className="font-medium">{event?.capacity ?? 'Unlimited'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="font-medium capitalize">
                      {event?.locationType || 'TBA'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {event?.category && (
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    {event.category}
                  </Badge>
                )}
                {event?.tags?.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-slate-100">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Event Key (Arkiv Entity)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-slate-900 break-all">
                    {eventKey}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyEventKey} className="shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-64">
              <Button
                onClick={handleRSVP}
                disabled={rsvpLoading || !address}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {rsvpLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                RSVP (Going)
              </Button>
              <p className="text-xs text-slate-500 text-center -mt-2">Confirm your attendance</p>

              <Button
                onClick={handleCheckin}
                disabled={checkinLoading || !address}
                variant="outline"
                className="border-slate-300"
              >
                {checkinLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                )}
                Check-in
              </Button>
              <p className="text-xs text-slate-500 text-center -mt-2">Mark yourself as present</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 font-semibold">
              <UserCheck className="w-5 h-5 text-blue-600" />
              RSVPs ({rsvps.length})
            </div>

            {rsvps.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <UserCheck className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No RSVPs yet</h3>
                <p className="text-sm text-slate-600">Be the first to RSVP for this event!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rsvps.map((rsvp) => {
                  const parsed = parsePayload(rsvp.payloadText) as ParsedRSVP | null;
                  if (!parsed) return null;

                  return (
                    <div
                      key={rsvp.key}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-sm font-mono text-slate-900">
                          {shortenAddress(parsed.attendee)}
                        </code>
                        <Badge
                          variant="secondary"
                          className={
                            parsed.status === 'going'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-700'
                          }
                        >
                          {parsed.status}
                        </Badge>
                      </div>
                      {parsed.createdAt && (
                        <p className="text-xs text-slate-500 mb-2">{formatDateTime(parsed.createdAt)}</p>
                      )}
                      <code className="text-xs text-slate-400 font-mono">
                        {shortenKey(rsvp.key)}
                      </code>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 font-semibold">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
              Attendance ({attendance.length})
            </div>

            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <ClipboardCheck className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No check-ins yet</h3>
                <p className="text-sm text-slate-600">Attendance records will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record) => {
                  const parsed = parsePayload(record.payloadText) as ParsedAttendance | null;
                  if (!parsed) return null;

                  return (
                    <div
                      key={record.key}
                      className="p-4 rounded-lg border border-slate-200 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-sm font-mono text-slate-900">
                          {shortenAddress(parsed.attendee)}
                        </code>
                        <Badge className="bg-green-600">Checked In</Badge>
                      </div>
                      {parsed.checkedInAt && (
                        <p className="text-xs text-slate-600 mb-2">
                          {formatDateTime(parsed.checkedInAt)}
                        </p>
                      )}
                      <code className="text-xs text-slate-400 font-mono">
                        {shortenKey(record.key)}
                      </code>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}