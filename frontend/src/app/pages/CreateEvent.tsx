import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, MapPin, Users, Tag, CheckCircle, Copy, Eye, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:8787';

interface FormData {
  title: string;
  city: string;
  startAtISO: string;
  category: string;
  locationType: string;
  capacity: string;
  tags: string;
}

interface FormErrors {
  title?: string;
  city?: string;
  startAtISO?: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    city: 'Buenos Aires',
    startAtISO: '',
    category: 'meetup',
    locationType: 'in-person',
    capacity: '50',
    tags: 'arkiv, web3'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eventKey, setEventKey] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.startAtISO.trim()) {
      newErrors.startAtISO = 'Start time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const requestBody = {
        title: formData.title.trim(),
        city: formData.city.trim(),
        startAtISO: formData.startAtISO,
        category: formData.category,
        locationType: formData.locationType,
        capacity: parseInt(formData.capacity) || 50,
        tags: tagsArray
      };

      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create event (${response.status}): ${text}`);
      }

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Response is not JSON: ${text}`);
      }
      
      setEventKey(data.eventKey);
      setSuccess(true);
      toast.success('Event created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyEventKey = () => {
    navigator.clipboard.writeText(eventKey);
    toast.success('Event key copied to clipboard');
  };

  const createAnother = () => {
    setSuccess(false);
    setEventKey('');
    setFormData({
      title: '',
      city: 'Buenos Aires',
      startAtISO: '',
      category: 'meetup',
      locationType: 'in-person',
      capacity: '50',
      tags: 'arkiv, web3'
    });
    setErrors({});
    setApiError(null);
  };

  if (success && eventKey) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-slate-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Event Created Successfully!
            </h2>
            <p className="text-slate-600 mb-8">
              Your event has been stored as an Arkiv entity
            </p>

            <div className="bg-slate-50 rounded-lg p-6 mb-8">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Event Key
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-900 break-all">
                  {eventKey}
                </code>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyEventKey}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate(`/event/${eventKey}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Event
              </Button>
              <Button 
                onClick={createAnother}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Create New Event
        </h1>
        <p className="text-slate-600">
          Create an immutable event record stored on Arkiv
        </p>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="whitespace-pre-wrap break-words">{apiError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-slate-700">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Web3 Developer Meetup"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city" className="text-slate-700">
                City <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city name"
                  className={`pl-10 ${errors.city ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <Label htmlFor="startAtISO" className="text-slate-700">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="startAtISO"
                  type="datetime-local"
                  value={formData.startAtISO}
                  onChange={(e) => setFormData({ ...formData, startAtISO: e.target.value })}
                  className={`pl-10 ${errors.startAtISO ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.startAtISO && (
                <p className="text-sm text-red-600 mt-1">{errors.startAtISO}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-slate-700">
                Category
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Type */}
            <div>
              <Label className="text-slate-700 mb-3 block">
                Location Type
              </Label>
              <RadioGroup 
                value={formData.locationType}
                onValueChange={(value) => setFormData({ ...formData, locationType: value })}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <Label htmlFor="in-person" className="font-normal cursor-pointer">
                    In-person
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="font-normal cursor-pointer">
                    Online
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Capacity */}
            <div>
              <Label htmlFor="capacity" className="text-slate-700">
                Capacity
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="50"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-slate-700">
                Tags
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="arkiv, web3, blockchain"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
