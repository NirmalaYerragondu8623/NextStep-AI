import React, { useState, useEffect } from 'react';
import { User, Award, Briefcase, Target, Cpu, Flame, Settings, Calendar, AlertTriangle, Plus, X, Sparkles, ArrowRight } from 'lucide-react';


export default function PreparationForm({ token, onPrepSubmitSuccess, addToast }) {
  const [fullName, setFullName] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Form Fields
  const [specialization, setSpecialization] = useState('');
  const [passoutYear, setPassoutYear] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [workingTech, setWorkingTech] = useState('');
  const [platformGoal, setPlatformGoal] = useState('Upskilling'); // Default
  const [techToLearn, setTechToLearn] = useState('React'); // Default
  const [proficiency, setProficiency] = useState('Beginner'); // Default
  
  // Technical Skills Tags
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);

  // Duration Type
  const [durationType, setDurationType] = useState('ai_suggest'); // 'ai_suggest' or 'user_provided'
  const [customDuration, setCustomDuration] = useState('8 weeks');

  // Modal and Submission State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch current user details on mount to auto-populate Full Name
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFullName(data.name);
        } else {
          addToast('Could not fetch user details.', 'error');
        }
      } catch (err) {
        addToast('Connection error fetching user info.', 'error');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, [token, addToast]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed) {
      if (skills.includes(trimmed)) {
        addToast('Skill already added', 'info');
      } else {
        setSkills(prev => [...prev, trimmed]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!specialization.trim()) tempErrors.specialization = 'Qualification/Specialization is required';
    if (!passoutYear) {
      tempErrors.passoutYear = 'Passing year is required';
    } else {
      const year = parseInt(passoutYear);
      if (isNaN(year) || year < 1950 || year > 2035) {
        tempErrors.passoutYear = 'Enter a valid year (1950 - 2035)';
      }
    }
    if (!currentRole.trim()) tempErrors.currentRole = 'Current role is required';
    if (!workingTech.trim()) tempErrors.workingTech = 'Working technology is required';
    if (skills.length === 0) tempErrors.skills = 'Please enter at least one technical skill';
    if (durationType === 'user_provided' && !customDuration.trim()) {
      tempErrors.customDuration = 'Please specify learning duration';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct validation errors first', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      const response = await fetch('http://localhost:8000/api/preparation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          highest_qualification_specialization: specialization,
          highest_qualification_year: parseInt(passoutYear),
          current_profession_role: currentRole,
          current_profession_tech: workingTech,
          platform_usage_goal: platformGoal,
          technology_to_learn: techToLearn,
          proficiency_level: proficiency,
          known_technical_skills: skills,
          learning_duration_type: durationType,
          learning_duration: durationType === 'user_provided' ? customDuration : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit onboarding form.');
      }

      addToast('Journey initialized successfully!', 'success');
      onPrepSubmitSuccess();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium">Setting up your preparation journey...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl p-8 rounded-2xl glass-panel glow-cyan transition-all duration-300 relative my-6">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 mb-3 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <div className="w-full h-full bg-darkBg rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">Preparation Profile</h2>
        <p className="text-gray-400 text-sm mt-1 text-center">Help us customize your path to success</p>
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-6">
        
        {/* Full Name (Read-Only) */}
        <div>
          <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Full Name (Read-Only)
          </label>
          <input
            type="text"
            value={fullName}
            readOnly
            className="w-full px-4 py-3 rounded-xl glass-input bg-white/5 text-gray-400 border-white/5 cursor-not-allowed select-none"
            title="Name is auto-populated and read-only"
          />
        </div>

        {/* Highest Qualification */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-gray-400" /> Specialization / Degree
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl glass-input ${errors.specialization ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="e.g. B.Tech in Computer Science"
            />
            {errors.specialization && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.specialization}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Passing Out Year</label>
            <input
              type="number"
              value={passoutYear}
              onChange={(e) => setPassoutYear(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl glass-input ${errors.passoutYear ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="e.g. 2024"
              min="1950"
              max="2035"
            />
            {errors.passoutYear && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.passoutYear}</p>}
          </div>
        </div>

        {/* Current Profession */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-gray-400" /> Current Role / Profession
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl glass-input ${errors.currentRole ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="e.g. Associate Analyst / Student"
            />
            {errors.currentRole && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.currentRole}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-gray-400" /> Working Technology
            </label>
            <input
              type="text"
              value={workingTech}
              onChange={(e) => setWorkingTech(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl glass-input ${errors.workingTech ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="e.g. Python / JavaScript / None"
            />
            {errors.workingTech && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.workingTech}</p>}
          </div>
        </div>

        {/* Platform Usage Goal */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-gray-400" /> Platform Usage Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['Upskilling', 'Job switch', 'New learning'].map((goalOption) => (
              <label
                key={goalOption}
                className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all duration-300 ${
                  platformGoal === goalOption
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="platformGoal"
                  value={goalOption}
                  checked={platformGoal === goalOption}
                  onChange={() => setPlatformGoal(goalOption)}
                  className="sr-only"
                />
                {goalOption}
              </label>
            ))}
          </div>
        </div>

        {/* Technology to Learn */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-gray-400" /> Technology to Learn
          </label>
          <select
            value={techToLearn}
            onChange={(e) => setTechToLearn(e.target.value)}
            className="w-full px-4 py-3 rounded-xl glass-input text-gray-200 cursor-pointer"
          >
            <option value="React" className="bg-darkBg text-gray-200">React (Web Frontend)</option>
            <option value="Python" className="bg-darkBg text-gray-200">Python (Backend/Data Science)</option>
            <option value="JavaScript" className="bg-darkBg text-gray-200">JavaScript (Fullstack)</option>
            <option value="Java" className="bg-darkBg text-gray-200">Java (Enterprise Systems)</option>
            <option value="Go" className="bg-darkBg text-gray-200">Go (Cloud Native backend)</option>
            <option value="Cloud Computing" className="bg-darkBg text-gray-200">Cloud Computing (AWS/GCP)</option>
            <option value="DevOps" className="bg-darkBg text-gray-200">DevOps (CI/CD, Kubernetes)</option>
            <option value="Machine Learning" className="bg-darkBg text-gray-200">Machine Learning / AI</option>
          </select>
        </div>

        {/* Proficiency Level */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-gray-400" /> Proficiency Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { level: 'Very new', desc: 'Need to learn from scratch' },
              { level: 'Beginner', desc: 'Basic syntactical knowledge' },
              { level: 'Intermediate', desc: 'Can build standard applications' },
              { level: 'Advanced', desc: 'Expert/Deep architectural design' }
            ].map((p) => (
              <label
                key={p.level}
                className={`flex flex-col items-start p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${
                  proficiency === p.level
                    ? 'bg-indigo-500/10 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="proficiency"
                  value={p.level}
                  checked={proficiency === p.level}
                  onChange={() => setProficiency(p.level)}
                  className="sr-only"
                />
                <span className="font-bold text-sm text-gray-200">{p.level}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{p.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Known Technical Skills Tag Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Known Technical Skills (Press Enter or comma to add)
          </label>
          <div className={`flex flex-wrap items-center gap-2 p-2 rounded-xl glass-input min-h-[50px] ${errors.skills ? 'border-red-500/50' : ''}`}>
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-gray-200 text-xs rounded-lg border border-white/10"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-gray-400 hover:text-rose-400 focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-transparent outline-none border-none py-1 px-2 text-xs text-white min-w-[150px]"
              placeholder="Type skills e.g. Git, Docker..."
            />
          </div>
          {errors.skills && <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.skills}</p>}
        </div>

        {/* Learning Duration */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" /> Learning Duration Setup
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${
                durationType === 'ai_suggest'
                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
              }`}
            >
              <input
                type="radio"
                name="durationType"
                value="ai_suggest"
                checked={durationType === 'ai_suggest'}
                onChange={() => setDurationType('ai_suggest')}
                className="sr-only"
              />
              <span className="font-bold text-sm">Let AI Suggest</span>
              <span className="text-[10px] text-gray-400 mt-1 text-center">Generates plan & milestones based on proficiency</span>
            </label>

            <label
              className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${
                durationType === 'user_provided'
                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
              }`}
            >
              <input
                type="radio"
                name="durationType"
                value="user_provided"
                checked={durationType === 'user_provided'}
                onChange={() => setDurationType('user_provided')}
                className="sr-only"
              />
              <span className="font-bold text-sm">I will specify duration</span>
              <span className="text-[10px] text-gray-400 mt-1 text-center">Customize plan details around my availability</span>
            </label>
          </div>

          {durationType === 'user_provided' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-fadeIn">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Specify Duration (e.g. 4 weeks, 3 months)</label>
              <input
                type="text"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl glass-input ${errors.customDuration ? 'border-red-500/50' : ''}`}
                placeholder="e.g. 6 weeks / 2 months"
              />
              {errors.customDuration && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.customDuration}</p>}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 mt-8 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Confirm Profile & Setup Journey <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* ----------------------------------------------------
      // CONFIRMATION POPUP MODAL (Matching high-fidelity Glassmorphic styling)
      // ---------------------------------------------------- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel glow-cyan border border-cyan-500/20 text-center animate-scaleIn">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            <h3 className="text-lg font-bold text-gray-100">Ready to Begin?</h3>
            <p className="text-gray-300 text-sm mt-3 leading-relaxed">
              We are using the AI agent to guide you through this preparation journey. Are you interested in this journey?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold border border-white/10 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] text-sm"
              >
                Yes, start my journey!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
