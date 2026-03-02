import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MessageSquare,
  Folder,
  ChevronDown,
  Menu,
  Sparkles,
  Zap,
  Search as SearchIcon,
  BarChart3,
  Send,
  MoreHorizontal,
  Database,
  X,
  ChevronRight,
  User,
  Clock,
  Shield,
  Code,
  Building2,
  TrendingUp,
  Mic,
  Sun,
  Moon,
} from 'lucide-react';
const logoLight = '/logo_LIGHT.png';
const logoDark = '/logo_DARK.png';
import '@/chat/index.css';

// Mode options
const MODES = [
  { id: 'auto', label: 'Auto', description: 'AI chooses the best mode', icon: Sparkles },
  { id: 'quick', label: 'Quick Chat', description: 'Fast data lookup', icon: Zap },
  { id: 'deep', label: 'Deep Search', description: 'Detailed analysis', icon: SearchIcon },
  { id: 'visualizer', label: 'Visualizer', description: 'Charts & graphs', icon: BarChart3 },
];

// Sample chat history
const RECENT_CHATS = [
  { id: 1, title: 'Groundwater levels query', date: '2 hours ago' },
  { id: 2, title: 'Water conservation tips', date: 'Yesterday' },
  { id: 3, title: 'Maharashtra water data', date: '3 days ago' },
];

const PROJECTS = [
  { id: 1, name: 'Water Analysis', icon: Folder },
];

// Sample data for dropdowns
const STATES = ['ANDHRA PRADESH', 'MAHARASHTRA', 'KARNATAKA', 'TAMIL NADU'];
const DISTRICTS = ['KURNOOL', 'MUMBAI', 'BANGALORE', 'CHENNAI'];
const BLOCKS = ['KURNOOL MANDAL', 'THANE', 'WHITEFIELD', 'VELACHERY'];

// Sample response data
const SAMPLE_DATA = [
  { year: '2023', extractable: '1916.87', extraction: '555.64', stage: '28.99', category: 'Safe' },
  { year: '2024', extractable: '--', extraction: '--', stage: '--', category: 'Unknown' },
];

function ChatPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedState, setSelectedState] = useState(STATES[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
  const [selectedBlock, setSelectedBlock] = useState(BLOCKS[0]);
  const [year2023, setYear2023] = useState(true);
  const [year2024, setYear2024] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modeDropdownRef = useRef(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect virtual keyboard height (mobile) to lift input and adjust layout
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kh = Math.max(0, window.innerHeight - vv.height);
      setKeyboardHeight(kh);
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    // initial
    onResize();

    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync body background with theme mode
  useEffect(() => {
    if (isLightMode) {
      document.body.style.background = '#f3f4f6';
      document.body.style.color = '#020617';
    } else {
      document.body.style.background = '#050a30';
      document.body.style.color = '#ffffff';
    }
  }, [isLightMode]);

  // Sidebar open state (allow closing)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Quick Chat modal for mobile
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeDropdown(false);
    // On mobile, show Quick Chat options in a centered modal
    if (mode.id === 'quick' && isMobile) {
      setShowQuickModal(true);
      setShowDataPanel(false);
    } else {
      setShowDataPanel(mode.id === 'quick');
    }
    setShowResults(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    navigate('/landing');
  };

  // Handle send message - actually call server
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: inputValue,
          isDetailedResponseNeeded: selectedMode.id === 'deep',
          isVisualizationNeeded: selectedMode.id === 'visualizer',
        }),
      });

      if (res.status === 401) {
        // not authorized, go back to landing
        navigate('/landing');
        return;
      }

      const data = await res.json();
      const text = data?.response?.text || JSON.stringify(data?.response);
      const botResponse = {
        id: Date.now() + 1,
        text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, text: 'Server error', sender: 'bot', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle get data
  const handleGetData = () => {
    setShowResults(true);
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${
        isLightMode ? 'bg-gradient-radial-light' : 'bg-gradient-radial'
      }`}>
      {/* Floating open-sidebar button (top-left), appears when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          style={{
            top: 'calc(env(safe-area-inset-top, 12px) + 12px)',
            left: 'calc(env(safe-area-inset-left, 12px) + 12px)',
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          className="fixed p-2 rounded-lg bg-black/40 backdrop-blur-md hover:bg-black/50 focus:outline-none"
        >
          <Menu className="w-5 h-5 text-white/80" />
        </button>
      )}
      {/* Sidebar (overlay) */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 glass-panel flex flex-col h-full shrink-0 z-50" style={{ maxHeight: '100vh' }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
              <img src={isLightMode ? logoLight : logoDark} alt="INGRES" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">INGRES</span>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-3">
          <button 
            onClick={() => { setMessages([]); setShowResults(false); }}
            className={`w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${
              isLightMode
                ? 'glass-card text-slate-800 hover:bg-white/20'
                : 'glass-card-dark text-white hover:bg-white/10'
            }`}
          >
            <Plus className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
            <span className="font-medium">New chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Recent Chats */}
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{
            paddingBottom: keyboardHeight ? `${keyboardHeight + 120}px` : undefined,
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div className="px-3 py-2">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Recent</span>
          </div>
          <div className="space-y-1">
            {RECENT_CHATS.map((chat) => (
              <button
                key={chat.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 group"
              >
                <MessageSquare className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm truncate flex-1 text-left">{chat.title}</span>
              </button>
            ))}
          </div>

          {/* Projects */}
          <div className="px-3 py-4">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Projects</span>
          </div>
          <div className="space-y-1">
            {PROJECTS.map((project) => (
              <button
                key={project.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 group"
              >
                <Folder className="w-4 h-4 text-blue-400" />
                <span className="text-sm">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <span className="text-sm font-medium text-white">N</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">User</p>
              <p className="text-xs text-white/50">Free plan</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <MoreHorizontal className="w-5 h-5 text-white/50" />
            </button>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <User className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>
          {/* Close Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header with theme toggle */}
        <header className="h-16 glass-panel border-b-0 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Open sidebar"
                style={{ zIndex: 9999, pointerEvents: 'auto' }}
              >
                <Menu className="w-5 h-5 text-white/70" />
              </button>
            )}
            <h1
              className={`text-lg font-semibold ${
                isLightMode ? 'text-slate-800' : 'text-white'
              }`}
            >
              INGRES ChatBOT
            </h1>
          </div>

          {/* Light / Dark mode toggle (top-right) - inspired by reference design */}
          <button
            onClick={() => setIsLightMode((prev) => !prev)}
            className="inline-flex items-center gap-3 px-2 py-1 rounded-full bg-transparent hover:bg-white/10 transition-colors text-xs font-medium"
            aria-label="Toggle light mode"
          >
            {/* Track */}
            <span
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                isLightMode ? 'bg-slate-300/80' : 'bg-blue-600'
              }`}
            >
              {/* Thumb */}
              <span
                className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                  isLightMode ? 'translate-x-0' : 'translate-x-5'
                }`}
              >
                {isLightMode ? (
                  <Moon className="w-3 h-3 text-slate-500" />
                ) : (
                  <Sun className="w-3 h-3 text-blue-500" />
                )}
              </span>
            </span>

            {/* Label */}
            <span
              className={`whitespace-nowrap ${
                isLightMode ? 'text-slate-600' : 'text-white/70'
              }`}
            >
              {isLightMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat */}
          <div className={`flex-1 flex flex-col ${showDataPanel ? 'border-r border-white/5' : ''}`}>
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6"
              style={{
                paddingBottom: keyboardHeight ? `${keyboardHeight + 160}px` : undefined,
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
              }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  {/* Logo */}
                    <div className="mb-8">
                      <img src={isLightMode ? logoLight : logoDark} alt="INGRES" className="w-16 h-16 object-contain" />
                    </div>
                  
                  <h2
                    className={`text-3xl font-bold mb-3 text-center ${
                      isLightMode ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    How can I help you today?
                  </h2>
                  <p
                    className={`text-center max-w-md ${
                      isLightMode ? 'text-slate-500' : 'text-white/50'
                    }`}
                  >
                    Ask me anything about India's groundwater resources.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      {message.sender === 'bot' && (
                        <div className="w-8 h-8 flex items-center justify-center mr-3 shrink-0">
                            <img src={isLightMode ? logoLight : logoDark} alt="bot" className="w-4 h-4 object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-5 py-3 ${
                          message.sender === 'user' ? 'message-user' : isLightMode ? 'message-bot-light' : 'message-bot-dark'
                        }`}
                      >
                        <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{message.text}</p>
                        <span className={`text-xs mt-2 block ${isLightMode ? 'text-slate-500' : 'text-white/40'}`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                   
                  {isTyping && (
                    <div className="flex justify-start animate-fadeIn">
                      <div className="w-8 h-8 flex items-center justify-center mr-3 shrink-0">
                        <img src={isLightMode ? logoLight : logoDark} alt="bot-typing" className="w-4 h-4 object-contain" />
                      </div>
                      <div className={`px-5 py-4 rounded-2xl rounded-tl-sm ${isLightMode ? 'message-bot-light' : 'message-bot-dark'}`}>
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div
              className="p-4 md:p-4 fixed md:static left-0 right-0 z-40"
              style={{ bottom: keyboardHeight ? `${keyboardHeight + 16}px` : '16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 8px)' }}
            >
              <div className="max-w-3xl mx-auto px-2">
                <div className={`rounded-2xl p-2 flex items-center gap-2 ${isLightMode ? 'glass-card' : 'glass-card-dark'}`}>
                  {/* Plus Button with Mode Dropdown */}
                  <div className="relative" ref={modeDropdownRef}>
                    <button 
                      onClick={() => setShowModeDropdown(!showModeDropdown)}
                      className={`p-2.5 rounded-xl transition-colors flex items-center gap-1 ${
                        isLightMode ? 'hover:bg-slate-200/80' : 'hover:bg-white/10'
                      }`}
                    >
                      <Plus
                        className={`w-5 h-5 ${
                          isLightMode ? 'text-slate-500' : 'text-white/60'
                        }`}
                      />
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          isLightMode ? 'text-slate-400' : 'text-white/40'
                        } ${showModeDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Mode Dropdown */}
                    {showModeDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 mode-dropdown rounded-2xl p-2 z-50 animate-fadeIn">
                        <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                          Select Mode
                        </div>
                        {MODES.map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => handleModeSelect(mode)}
                            className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                              selectedMode.id === mode.id 
                                ? 'bg-blue-500/20 border border-blue-500/30' 
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedMode.id === mode.id ? 'bg-blue-500' : 'bg-white/10'
                            }`}>
                              <mode.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-medium ${selectedMode.id === mode.id ? 'text-white' : 'text-white/80'}`}>
                                {mode.label}
                              </p>
                              <p className="text-xs text-white/50">{mode.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Current Mode Indicator */}
                  <div
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                      isLightMode ? 'bg-white/80 shadow-sm' : 'bg-white/5'
                    }`}
                  >
                    <selectedMode.icon
                      className={`w-4 h-4 ${
                        isLightMode ? 'text-blue-500' : 'text-blue-400'
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        isLightMode ? 'text-slate-600' : 'text-white/60'
                      }`}
                    >
                      {selectedMode.label}
                    </span>
                  </div>
                  
                  {/* Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    onFocus={() => {
                      // ensure latest messages are visible when keyboard shows
                      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                    placeholder="Type your message..."
                    className={`flex-1 bg-transparent text-sm py-3 px-2 focus:outline-none ${
                      isLightMode
                        ? 'text-slate-800 placeholder:text-slate-400'
                        : 'text-white placeholder:text-white/40'
                    }`}
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      inputValue.trim()
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Query Panel - for Quick Chat mode */}
          {showDataPanel && (
            <div className={`w-96 quick-mode-panel flex flex-col animate-slideIn ${
                isLightMode ? 'quick-mode-panel-light' : 'quick-mode-panel-dark'
              }`}>
              <div className="p-4 border-b border-white/5">
                <h3
                  className={`text-sm font-semibold uppercase tracking-wider ${
                    isLightMode ? 'text-slate-700' : 'text-white/80'
                  }`}
                >
                  Data Query
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* State Dropdown */}
                <div>
                  <label
                    className={`text-sm mb-2 block ${
                      isLightMode ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    State
                  </label>
                  <div className="relative">
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                      }`}
                    >
                      {STATES.map((state) => (
                        <option key={state} value={state} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{state}</option>
                      ))}
                    </select>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isLightMode ? 'text-slate-400' : 'text-white/40'
                      }`}
                    />
                  </div>
                </div>

                {/* District Dropdown */}
                <div>
                  <label
                    className={`text-sm mb-2 block ${
                      isLightMode ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    District
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                      }`}
                    >
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{district}</option>
                      ))}
                    </select>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isLightMode ? 'text-slate-400' : 'text-white/40'
                      }`}
                    />
                  </div>
                </div>

                {/* Block Dropdown */}
                <div>
                  <label
                    className={`text-sm mb-2 block ${
                      isLightMode ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    Block / Assessment Unit
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                      }`}
                    >
                      {BLOCKS.map((block) => (
                        <option key={block} value={block} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{block}</option>
                      ))}
                    </select>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isLightMode ? 'text-slate-400' : 'text-white/40'
                      }`}
                    />
                  </div>
                </div>

                {/* Years */}
                <div>
                  <label
                    className={`text-sm mb-2 block ${
                      isLightMode ? 'text-slate-600' : 'text-white/60'
                    }`}
                  >
                    Years
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={year2023}
                        onChange={(e) => setYear2023(e.target.checked)}
                        className={isLightMode ? 'custom-checkbox-light' : 'custom-checkbox'}
                      />
                      <span
                        className={`text-sm ${
                          isLightMode ? 'text-slate-700' : 'text-white/80'
                        }`}
                      >
                        2023
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={year2024}
                        onChange={(e) => setYear2024(e.target.checked)}
                        className={isLightMode ? 'custom-checkbox-light' : 'custom-checkbox'}
                      />
                      <span
                        className={`text-sm ${
                          isLightMode ? 'text-slate-700' : 'text-white/80'
                        }`}
                      >
                        2024
                      </span>
                    </label>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      isLightMode ? 'text-slate-400' : 'text-white/40'
                    }`}
                  >
                    Select none to use the latest year.
                  </p>
                </div>

                {/* Get Data Button */}
                <button
                  onClick={handleGetData}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
                >
                  Get Data
                </button>

                {/* Results */}
                {showResults && (
                  <div className="animate-fadeIn">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-xs text-blue-500 mb-4 flex-wrap">
                      <span>{selectedState}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{selectedDistrict}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{selectedBlock}</span>
                    </div>

                    {/* Data Table */}
                    <div className={`rounded-xl overflow-hidden ${isLightMode ? 'glass-card' : 'quick-mode-table-dark'}`}>
                      <table className="data-table text-sm">
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Annual Extractable (Ham)</th>
                            <th>Total Extraction (Ham)</th>
                            <th>Stage (%)</th>
                            <th>Categorization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {SAMPLE_DATA.map((row, index) => (
                            <tr key={index}>
                              <td className={isLightMode ? 'text-slate-800' : 'text-white/80'}>{row.year}</td>
                              <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.extractable}</td>
                              <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.extraction}</td>
                              <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.stage}</td>
                              <td>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  row.category === 'Safe' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {row.category}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Chat modal for mobile */}
          {showQuickModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuickModal(false)} />
              <div className={`relative w-full max-w-md mx-auto rounded-xl p-4 z-10 max-h-[90vh] overflow-auto ${
                isLightMode ? 'quick-mode-panel-light' : 'quick-mode-panel-dark'
              }`}>
                <div className="flex items-start justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-800' : 'text-white/80'}`}>Quick Chat - Data Query</h3>
                  <button onClick={() => setShowQuickModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isLightMode ? 'text-slate-700' : 'text-white/60'}`}>State</label>
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                        }`}
                      >
                        {STATES.map((state) => (
                          <option key={state} value={state} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{state}</option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? 'text-slate-400' : 'text-white/40'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isLightMode ? 'text-slate-700' : 'text-white/60'}`}>District</label>
                    <div className="relative">
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                        }`}
                      >
                        {DISTRICTS.map((district) => (
                          <option key={district} value={district} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{district}</option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? 'text-slate-400' : 'text-white/40'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isLightMode ? 'text-slate-700' : 'text-white/60'}`}>Block / Assessment Unit</label>
                    <div className="relative">
                      <select
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isLightMode ? 'glass-input-light text-slate-800' : 'glass-input-quick-dark text-white'
                        }`}
                      >
                        {BLOCKS.map((block) => (
                          <option key={block} value={block} className={isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{block}</option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? 'text-slate-400' : 'text-white/40'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isLightMode ? 'text-slate-700' : 'text-white/60'}`}>Years</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={year2023}
                          onChange={(e) => setYear2023(e.target.checked)}
                          className={isLightMode ? 'custom-checkbox-light' : 'custom-checkbox'}
                        />
                        <span className={`text-sm ${isLightMode ? 'text-slate-800' : 'text-white/80'}`}>2023</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={year2024}
                          onChange={(e) => setYear2024(e.target.checked)}
                          className={isLightMode ? 'custom-checkbox-light' : 'custom-checkbox'}
                        />
                        <span className={`text-sm ${isLightMode ? 'text-slate-800' : 'text-white/80'}`}>2024</span>
                      </label>
                    </div>
                    <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-500' : 'text-white/40'}`}>Select none to use the latest year.</p>
                  </div>

                  <button
                    onClick={() => { handleGetData(); /* keep modal open on mobile so results are visible */ }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
                  >
                    Get Data
                  </button>

                  {showResults && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center gap-1 text-xs text-blue-400 mb-4 flex-wrap">
                        <span>{selectedState}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{selectedDistrict}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{selectedBlock}</span>
                      </div>

                      <div className={`rounded-xl overflow-hidden ${isLightMode ? 'glass-card' : 'quick-mode-table-dark'}`}>
                        <table className="data-table text-sm">
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Annual Extractable (Ham)</th>
                              <th>Total Extraction (Ham)</th>
                              <th>Stage (%)</th>
                              <th>Categorization</th>
                            </tr>
                          </thead>
                          <tbody>
                            {SAMPLE_DATA.map((row, index) => (
                              <tr key={index}>
                                <td className={isLightMode ? 'text-slate-800' : 'text-white/80'}>{row.year}</td>
                                <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.extractable}</td>
                                <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.extraction}</td>
                                <td className={isLightMode ? 'text-slate-600' : 'text-white/60'}>{row.stage}</td>
                                <td>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    row.category === 'Safe' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {row.category}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ChatPage;