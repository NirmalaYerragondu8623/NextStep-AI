import React, { useEffect, useState } from 'react';
import { LogOut, BookOpen, Award, Video, CheckSquare, Plus, ExternalLink, Calendar, Compass, Code, Info, HelpCircle } from 'lucide-react';

export default function Dashboard({ token, onLogout, addToast }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local states for interactivity
  const [savedProjects, setSavedProjects] = useState([]);
  const [customCertifications, setCustomCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ name: '', provider: '', dueDate: '' });
  const [showAddCert, setShowAddCert] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  
  // Detail helpers
  const [projectHelp, setProjectHelp] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Session expired or unauthorized. Please log in again.');
        }
        
        const resData = await response.json();
        setData(resData);
        setTasks(resData.dailyReporter.tasks);
      } catch (err) {
        addToast(err.message, 'error');
        onLogout();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token, onLogout, addToast]);

  const handleAddProject = (project) => {
    if (savedProjects.find(p => p.id === project.id)) {
      addToast('Project already saved!', 'info');
      return;
    }
    setSavedProjects(prev => [...prev, project]);
    addToast(`"${project.title}" added to saved projects.`, 'success');
  };

  const handleRemoveProject = (projectId) => {
    setSavedProjects(prev => prev.filter(p => p.id !== projectId));
    addToast('Project removed from saved list.', 'info');
  };

  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `custom-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    addToast('Task added to Daily Report.', 'success');
  };

  const handleAddCert = (e) => {
    e.preventDefault();
    if (!newCert.name.trim() || !newCert.provider.trim()) {
      addToast('Please fill out name and provider.', 'error');
      return;
    }
    const createdCert = {
      id: `cert-${Date.now()}`,
      ...newCert,
      progress: 0
    };
    setCustomCertifications(prev => [...prev, createdCert]);
    setNewCert({ name: '', provider: '', dueDate: '' });
    setShowAddCert(false);
    addToast('Certification added to tracker successfully!', 'success');
  };

  const updateCertProgress = (certId, increment) => {
    setCustomCertifications(prev => prev.map(c => {
      if (c.id === certId) {
        const nextProgress = Math.min(Math.max(c.progress + increment, 0), 100);
        if (nextProgress === 100 && c.progress < 100) {
          addToast(`Congratulations! You completed ${c.name}!`, 'success');
        }
        return { ...c, progress: nextProgress };
      }
      return c;
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium animate-pulse">Loading NextStep dashboard...</p>
      </div>
    );
  }

  const user = data?.user || {};

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navbar Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5">
            <div className="w-full h-full bg-darkBg rounded-[10px] flex items-center justify-center overflow-hidden">
              <img src="/src/assets/logo.png" alt="Logo" className="w-7 h-7 object-contain error-fallback-logo" onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="text-sm font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">NS</span>';
              }} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">NextStep AI</h1>
            <p className="text-xs text-gray-400">PrepCompanion Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-200">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={() => {
              onLogout();
              addToast('Logged out successfully', 'info');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-gray-300 font-medium transition-all duration-300 border border-white/10 hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Project Monitor & Webinars */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Component 1: Project Monitor */}
          <section className="p-6 rounded-2xl glass-panel glow-cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-100">Project Monitor</h2>
                  <p className="text-xs text-gray-400">Add suggested projects to start tracking</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-semibold">
                {savedProjects.length} Saved
              </span>
            </div>

            {/* Saved Projects */}
            {savedProjects.length > 0 && (
              <div className="mb-6 pb-6 border-b border-white/5">
                <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Your Tracked Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedProjects.map(project => (
                    <div key={project.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/20 transition-all">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-200 text-sm">{project.title}</h4>
                        <button 
                          onClick={() => handleRemoveProject(project.id)}
                          className="text-gray-400 hover:text-rose-400 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {project.techStack.map(tech => (
                          <span key={tech} className="text-[10px] px-2 py-0.5 bg-cyan-950/40 text-cyan-300 rounded border border-cyan-900/30 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* AI Assistance Action Links */}
                      <div className="flex gap-2.5 mt-3 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => setProjectHelp({
                            title: project.title,
                            type: 'Tech Stack',
                            content: `To build this, learn: ${project.techStack.join(', ')}. Focus on designing APIs first, then core frontend layout, then DB integration.`
                          })}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Code className="w-3 h-3" /> Tech Stack
                        </button>
                        <button 
                          onClick={() => setProjectHelp({
                            title: project.title,
                            type: 'How to Start',
                            content: `Start by initializing a Git repository, setting up the configuration files, creating database schemas, and writing a mock API endpoint to run frontend logic.`
                          })}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Compass className="w-3 h-3" /> How to Start
                        </button>
                        <button 
                          onClick={() => setProjectHelp({
                            title: project.title,
                            type: 'Key Requirements',
                            content: `Include: User authentication (JWT), error state handling, structured database entities, responsive design layouts, dynamic toast notifications, and secure CORS headers.`
                          })}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Info className="w-3 h-3" /> What to Include
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assistance Detail Box */}
            {projectHelp && (
              <div className="mb-6 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-100 relative">
                <button 
                  onClick={() => setProjectHelp(null)}
                  className="absolute top-2.5 right-2.5 text-cyan-400 hover:text-cyan-200 text-xs"
                >
                  Dismiss
                </button>
                <div className="flex items-center gap-2 mb-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wide text-cyan-400">{projectHelp.type}: {projectHelp.title}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{projectHelp.content}</p>
              </div>
            )}

            {/* Suggested Projects */}
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Recommendations Based on Your Skills</h3>
            <div className="space-y-3">
              {data?.projectMonitor.suggested.map(project => (
                <div key={project.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/10 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-200">{project.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        project.level === 'Advanced' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        project.level === 'Intermediate' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {project.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.techStack.map(tech => (
                        <span key={tech} className="text-[10px] text-gray-300 font-medium">#{tech}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProject(project)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> ADD
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Component 2: Webinar & Tech Events Tracker */}
          <section className="p-6 rounded-2xl glass-panel">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100">Webinar Tracker</h2>
                <p className="text-xs text-gray-400">Upcoming tech events and interactive learning options</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.webinarTracker.upcoming.map(event => (
                <div key={event.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-200 text-sm line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-gray-400">With {event.speakers.join(', ')}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date} at {event.time}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-500/15 text-[11px] text-gray-300 leading-relaxed">
                    <span className="font-bold text-indigo-300 block mb-0.5">Pre-event Advice:</span>
                    Read up on {event.id === 'w1' ? 'FastAPI Asynchronous endpoints vs synchronous models' : 'CSS box shadow glows and Framer Motion layouts'} beforehand!
                  </div>

                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:underline"
                  >
                    Register for event <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Hand: Certification Tracker & Daily Reporter */}
        <div className="space-y-8">
          
          {/* Component 3: Certification Tracker */}
          <section className="p-6 rounded-2xl glass-panel glow-purple">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-100">Certifications</h2>
                  <p className="text-xs text-gray-400">Track and celebrate certificates</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCert(!showAddCert)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-purple-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Certification Form inline */}
            {showAddCert && (
              <form onSubmit={handleAddCert} className="p-4 rounded-xl bg-white/5 border border-purple-500/20 space-y-3 mb-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wide">Add Certificate Tracker</h3>
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={newCert.name}
                  onChange={e => setNewCert(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Provider (e.g. Google, AWS)"
                  value={newCert.provider}
                  onChange={e => setNewCert(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <input
                  type="date"
                  value={newCert.dueDate}
                  onChange={e => setNewCert(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddCert(false)}
                    className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded text-white font-semibold"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Custom and Tracked Certifications */}
            <div className="space-y-4">
              {customCertifications.map(cert => (
                <div key={cert.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-200">{cert.name}</h4>
                      <p className="text-[10px] text-gray-400">{cert.provider} • Target Date: {cert.dueDate || 'Open'}</p>
                    </div>
                    <span className="text-xs text-purple-400 font-bold">{cert.progress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full transition-all duration-300" style={{ width: `${cert.progress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <button 
                      onClick={() => updateCertProgress(cert.id, -10)}
                      disabled={cert.progress === 0}
                      className="text-gray-400 hover:text-gray-200 disabled:opacity-30"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={() => updateCertProgress(cert.id, 10)}
                      disabled={cert.progress === 100}
                      className="text-purple-400 hover:text-purple-300 font-bold"
                    >
                      +10% Progress
                    </button>
                  </div>
                </div>
              ))}

              {/* Default Recommendations */}
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">Recommended Certs</h3>
              {data?.certificationTracker.suggested.map(cert => (
                <div key={cert.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-xs text-gray-200">{cert.name}</h4>
                    <p className="text-[10px] text-gray-400">{cert.provider} • {cert.relevance}</p>
                  </div>
                  <button
                    onClick={() => {
                      const createdCert = {
                        id: `cert-${Date.now()}`,
                        name: cert.name,
                        provider: cert.provider,
                        dueDate: '',
                        progress: 0
                      };
                      setCustomCertifications(prev => [...prev, createdCert]);
                      addToast(`Started tracking: ${cert.name}`, 'success');
                    }}
                    className="flex-shrink-0 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded text-[11px] font-bold transition-all"
                  >
                    Track
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Component 4: Daily Reporter (Daily Tracker) */}
          <section className="p-6 rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-100">Daily Reporter</h2>
                  <p className="text-xs text-gray-400">Add tasks and check daily progress</p>
                </div>
              </div>
            </div>

            {/* Task summary metrics */}
            <div className="p-3 rounded-xl bg-emerald-950/10 border border-emerald-500/15 mb-4 flex items-center justify-between">
              <span className="text-xs text-gray-300">Completion Score</span>
              <span className="text-sm font-extrabold text-emerald-400">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
              </span>
            </div>

            {/* Add Task Input Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="What did you work on today?"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                className="flex-grow px-3 py-1.5 rounded-lg glass-input text-xs"
              />
              <button 
                type="submit"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Tasks list */}
            <div className="space-y-2">
              {tasks.map(task => (
                <label 
                  key={task.id} 
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    task.completed 
                      ? 'bg-emerald-950/10 border-emerald-500/10 text-gray-400 line-through' 
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    className="mt-0.5 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4"
                  />
                  <span className="text-xs font-medium">{task.text}</span>
                </label>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
