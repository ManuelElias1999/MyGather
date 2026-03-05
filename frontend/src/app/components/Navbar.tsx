import { Link, useLocation } from 'react-router';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/discover" className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <div className="flex flex-col">
                <span className="font-semibold text-lg text-slate-900">MyGather</span>
                <span className="text-[10px] text-slate-500 -mt-1">powered by Arkiv</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link 
                to="/discover" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/discover') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Discover Events
              </Link>
              <Link 
                to="/create" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/create') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Create Event
              </Link>
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <Link 
              to="/discover" 
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isActive('/discover') 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600'
              }`}
            >
              Discover
            </Link>
            <Link 
              to="/create" 
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isActive('/create') 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600'
              }`}
            >
              Create
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
