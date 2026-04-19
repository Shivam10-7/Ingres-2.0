import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { OrbitProgress } from "react-loading-indicators";
import DOMPurify from "dompurify";
import {
  Plus,
  ChevronDown,
  Menu,
  Sparkles,
  Zap,
  Search as SearchIcon,
  BarChart3,
  Send,
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
  Map as MapIcon,
} from "lucide-react";

import {
  sendGeminiRagRequest,
  sendChatRequest,
  getGwraMapData,
  getGwraLocations,
  getAuthHeaders,
  getUserChatSessions,
  createNewChatSession,
  getChatSessionHistory,
  saveChatMessage,
  ChatSession,
  GwraMapSummary,
} from "@/lib/api";
import { API_BASE_URL, QUICKCHAT_URL } from "@/lib/config";
import { ChatSidebarContent } from "@/components/ChatSidebarContent";
import { EChartsRenderer } from "@/components/EChartsRenderer";
import IndiaMapComponent from "@/components/IndiaMapComponent";
import gwraMapDataJson from "../../../../Data/GWRA_MapData.json";
const logoLight = "/logo_LIGHT.png";
const logoDark = "/logo_DARK.png";
import "@/chat/index.css";

/** Smooth sidebar motion (ease-out; mobile + desktop stay in sync). */
const SIDEBAR_DURATION = 0.48;
const SIDEBAR_EASE = [0.32, 0.72, 0, 1] as const;

// Mode options
const MODES = [
  {
    id: "auto",
    label: "Auto",
    description: "AI chooses the best mode",
    icon: Sparkles,
  },
  {
    id: "quick",
    label: "Quick Chat",
    description: "Fast data lookup",
    icon: Zap,
  },
  {
    id: "deep",
    label: "Deep Search",
    description: "Detailed analysis",
    icon: SearchIcon,
  },
  {
    id: "visualizer",
    label: "Visualizer",
    description: "Charts & graphs",
    icon: BarChart3,
  },
];

const SUGGESTION_ICONS = [
  <Database className="w-6 h-6 text-blue-500" />,
  <BarChart3 className="w-6 h-6 text-blue-500" />,
  <MapIcon className="w-6 h-6 text-blue-500" />,
  <Shield className="w-6 h-6 text-blue-500" />,
];

const SAMPLE_DATA = [
  {
    year: "2024",
    extractable: "120.4",
    extraction: "82.1",
    stage: "68.2",
    category: "Safe",
  },
  {
    year: "2023",
    extractable: "118.9",
    extraction: "85.6",
    stage: "72.0",
    category: "Safe",
  },
] as const;

type SuggestionOption = {
  label: string;
  prompt: string;
};

type ChatMessageItem = {
  id: string | number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  chartData?: any;
  options?: SuggestionOption[];
  isNew?: boolean;
};

type MapSelection = {
  state?: string;
  district?: string;
};

const LOCAL_GWRA_MAP_DATA = gwraMapDataJson as {
  source?: string;
  generatedAt?: string;
  states?: Record<string, GwraMapSummary>;
  districts?: Record<string, GwraMapSummary>;
};

const buildLocationSuggestions = (place: string): SuggestionOption[] => [
  {
    label: `Ground Water-Level (${place})`,
    prompt: `Give me groundwater level of ${place}`,
  },
  {
    label: `Total Recharge (${place})`,
    prompt: `Give me total recharge in ${place}`,
  },
  {
    label: `Stage (${place})`,
    prompt: `Give me stage of groundwater extraction in ${place}`,
  },
  {
    label: `Categorization (${place})`,
    prompt: `Give me groundwater categorization of ${place}`,
  },
];

const normalizeMapName = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatMapNumber = (value?: number | null, unit = "") => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });

  return unit ? `${formatted} ${unit}` : formatted;
};

const formatStatusLabel = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const roundMapMetric = (value: number) => Math.round(value * 100) / 100;

const categoryFromRank = (rank: number) => {
  if (rank >= 4) return "Over Exploited";
  if (rank >= 3) return "Critical";
  if (rank >= 2) return "Semi Critical";
  return "Safe";
};

const statusFromRank = (rank: number) => {
  if (rank >= 3) return "critical";
  if (rank >= 2) return "caution";
  return "safe";
};

const buildDerivedStateSummaries = (
  districtData: Record<string, GwraMapSummary>,
) => {
  const groupedStates = new Map<
    string,
    {
      name: string;
      recharge: number;
      extractable: number;
      extraction: number;
      stage: number;
      categoryRank: number;
      districtCount: number;
    }
  >();

  Object.values(districtData).forEach((entry) => {
    const stateName = entry.state?.trim();
    if (!stateName) return;

    const existing = groupedStates.get(stateName) ?? {
      name: stateName,
      recharge: 0,
      extractable: 0,
      extraction: 0,
      stage: 0,
      categoryRank: 0,
      districtCount: 0,
    };

    existing.recharge += Number(entry.recharge) || 0;
    existing.extractable += Number(entry.extractable) || 0;
    existing.extraction += Number(entry.extraction) || 0;
    existing.stage += Number(entry.stage) || 0;
    existing.categoryRank += Number(entry.categoryRank) || 0;
    existing.districtCount += 1;

    groupedStates.set(stateName, existing);
  });

  const derivedStates: Record<string, GwraMapSummary> = {};

  groupedStates.forEach((entry, stateName) => {
    if (!entry.districtCount) return;

    const averageRank = entry.categoryRank / entry.districtCount;
    const roundedRank = Math.min(4, Math.max(1, Math.round(averageRank)));

    derivedStates[stateName] = {
      name: entry.name,
      state: "",
      recharge: roundMapMetric(entry.recharge / entry.districtCount),
      extractable: roundMapMetric(entry.extractable / entry.districtCount),
      extraction: roundMapMetric(entry.extraction / entry.districtCount),
      stage: roundMapMetric(entry.stage / entry.districtCount),
      unitCount: entry.districtCount,
      categoryRank: roundedRank,
      worstCategory: categoryFromRank(roundedRank),
      status: statusFromRank(roundedRank),
    };
  });

  return derivedStates;
};

const isSupportedMapQueryText = (value = "") => {
  const normalized = value.toLowerCase().trim();
  return (
    normalized.includes("groundwater level") ||
    normalized.includes("groundwater_level") ||
    normalized.includes("total recharge") ||
    normalized.includes("total_recharge") ||
    normalized.includes("extractable") ||
    normalized.includes("extraction") ||
    normalized.includes("stage of groundwater extraction") ||
    normalized.includes("categorization") ||
    normalized.includes("category") ||
    normalized.includes("stage")
  );
};

const formatMessageText = (text: string) => {
  if (!text) return null;

  // Split by literal \n or actual newline
  const lines = text.split(/(?:\\n|\n)/);

  return lines.map((line, lineIndex) => {
    // Split by **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);

    return (
      <React.Fragment key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (partIndex % 2 === 1) {
            return (
              <strong key={partIndex} className="font-bold">
                {part}
              </strong>
            );
          }
          return part ? <span key={partIndex}>{part}</span> : null;
        })}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const TypewriterText = React.memo(
  ({
    text,
    isNew,
    onUpdate,
    onComplete,
  }: {
    text: string;
    isNew?: boolean;
    onUpdate?: () => void;
    onComplete?: () => void;
  }) => {
    const [displayedText, setDisplayedText] = React.useState(isNew ? "" : text);
    const onUpdateRef = React.useRef(onUpdate);
    const onCompleteRef = React.useRef(onComplete);

    React.useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    React.useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    React.useEffect(() => {
      if (!isNew) {
        setDisplayedText(text);
        return;
      }

      let currentIndex = 0;
      let lastScroll = 0;
      const interval = setInterval(() => {
        const chunkSize = Math.floor(Math.random() * 3) + 2;
        currentIndex += chunkSize;
        if (currentIndex >= text.length) {
          setDisplayedText(text);
          clearInterval(interval);
          if (onCompleteRef.current) onCompleteRef.current();
        } else {
          setDisplayedText(text.slice(0, currentIndex));
          const now = Date.now();
          if (onUpdateRef.current && now - lastScroll > 100) {
            onUpdateRef.current();
            lastScroll = now;
          }
        }
      }, 15);

      return () => clearInterval(interval);
    }, [text, isNew]);

    return <>{formatMessageText(displayedText)}</>;
  },
);

function ChatPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);

  // Chat History States
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Toggle buttons and output data
  const [isVisualizationNeeded, setIsVisualizationNeeded] = useState(false);
  const [isDetailedResponseNeeded, setIsDetailedResponseNeeded] =
    useState(false);
  const [isMapNeeded, setIsMapNeeded] = useState(false);
  const [lastChartData, setLastChartData] = useState<any>(null);
  const [mapSelection, setMapSelection] = useState<MapSelection | null>(null);
  const [mapStatesData, setMapStatesData] = useState<
    Record<string, GwraMapSummary>
  >({});
  const [mapDistrictsData, setMapDistrictsData] = useState<
    Record<string, GwraMapSummary>
  >({});
  const mapStatesDataRef = useRef<Record<string, GwraMapSummary>>({});
  const mapDistrictsDataRef = useRef<Record<string, GwraMapSummary>>({});
  const derivedStateNamesRef = useRef<Set<string>>(new Set());

  const [location, setLocation] = useState<{
    city?: string;
    state?: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [suggestionContextLabel, setSuggestionContextLabel] = useState("India");
  const [showInlineMapOptions, setShowInlineMapOptions] = useState(false);

  //For Renaming & Deleting the ChatNames
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  // Fetch user and chats on mount
  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
          credentials: "include",
          headers: {
            ...getAuthHeaders(),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const uid = data.user?.userId || data.user?._id || data.user?.id;
          setUserId(uid);
          setUserEmail(
            typeof data.user?.email === "string" ? data.user.email : null,
          );
          if (uid) {
            const userChats = await getUserChatSessions(uid);
            setChats(userChats);
          }
        }
      } catch (error) {
        console.error("Error fetching user or chats:", error);
      }
    };
    fetchUserAndChats();
  }, []);

  const loadChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setMessages([]);
    setShowResults(false);
    setIsChatLoading(true);

    const history = await getChatSessionHistory(chatId);

    if (history && history.messages) {
      const formattedMessages = history.messages.map((m: any, i: number) => {
        const content = m.content;

        let text = "";
        let chartData: any;

        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          const first = content[0] ?? {};
          text =
            typeof first.response === "string"
              ? first.response
              : JSON.stringify(first);
          chartData = first.chartData ?? first.chartdata;
        } else if (content && typeof content === "object") {
          text =
            typeof content.response === "string"
              ? content.response
              : JSON.stringify(content);
          chartData = content.chartData ?? content.chartdata;
        }

        return {
          id: m._id || i,
          text,
          chartData,
          sender: m.role === "user" ? "user" : "bot",
          timestamp: new Date(m.timestamp || Date.now()),
          isNew: false,
        };
      });

      setMessages(formattedMessages);
    }

    setIsChatLoading(false);
  };

  const handleNewChatClick = () => {
    setCurrentChatId(null);
    setMessages([]);
    setShowResults(false);
  };
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [year2023, setYear2023] = useState(true);
  const [year2024, setYear2024] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modeDropdownRef = useRef(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(event.target)
      ) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect virtual keyboard height (mobile) to lift input and adjust layout
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kh = Math.max(0, window.innerHeight - vv.height);
      setKeyboardHeight(kh);
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    // initial
    onResize();

    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Sync body background with theme mode (only for Chat page; landing/login stay light)
  useEffect(() => {
    document.body.classList.add("chat-page-theme");
    if (isLightMode) {
      document.body.style.background = "#f3f4f6";
      document.body.style.color = "#020617";
    } else {
      document.body.style.background = "#050a30";
      document.body.style.color = "#ffffff";
    }
    // Clear body styles on unmount so landing/login are not affected when user navigates back
    return () => {
      document.body.classList.remove("chat-page-theme");
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [isLightMode]);

  // Sidebar open state (allow closing)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  /** Sidebar width scales with signed-in email length (longer Gmail → wider panel, capped at 28rem). */
  const sidebarWidthPx = useMemo(() => {
    const len = (userEmail ?? "").trim().length;
    const minW = 288; // 18rem
    const maxW = 448; // 28rem (previous max-w-[28rem])
    if (len === 0) return 320;
    return Math.min(maxW, Math.max(minW, 195 + Math.round(len * 6.5)));
  }, [userEmail]);

  // Quick Chat modal for mobile
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Map panel state (integrated in main chat screen)
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false); // start hidden until user clicks map icon
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Handle mode selection
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeDropdown(false);

    if (mode.id === "quick") {
      window.location.href = QUICKCHAT_URL;
      return;
    }

    setShowQuickModal(false);
    setShowDataPanel(false);

    // ⭐ AUTO should reset everything
    if (mode.id === "auto") {
      setIsDetailedResponseNeeded(false);
      setIsVisualizationNeeded(false);
    }

    if (mode.id === "deep") {
      setIsDetailedResponseNeeded(true);
    }

    if (mode.id === "visualizer") {
      setIsVisualizationNeeded(true);
    }

    setShowResults(false);
  };

  useEffect(() => {
    if (!isMapNeeded && !isMapPanelOpen) {
      return;
    }

    const loadMapData = async () => {
      const response =
        LOCAL_GWRA_MAP_DATA &&
        Object.keys(LOCAL_GWRA_MAP_DATA.states ?? {}).length > 0
          ? LOCAL_GWRA_MAP_DATA
          : await getGwraMapData();
      const nextDistricts = response.districts ?? {};
      const derivedStates = buildDerivedStateSummaries(nextDistricts);
      const nextStates =
        Object.keys(derivedStates).length > 0
          ? derivedStates
          : response.states ?? {};

      mapStatesDataRef.current = nextStates;
      mapDistrictsDataRef.current = nextDistricts;
      derivedStateNamesRef.current = new Set(Object.keys(derivedStates));
      setMapStatesData(nextStates);
      setMapDistrictsData(nextDistricts);
    };

    loadMapData();
  }, [isMapNeeded, isMapPanelOpen]);

  useEffect(() => {
    const loadStates = async () => {
      const response = await getGwraLocations();
      const nextStates = response.states ?? [];

      setStateOptions(nextStates);

      if (nextStates.length > 0) {
        setSelectedState((current) =>
          current && nextStates.includes(current) ? current : nextStates[0],
        );
      }
    };

    loadStates();
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setCityOptions([]);
      setSelectedDistrict("");
      setBlockOptions([]);
      setSelectedBlock("");
      return;
    }

    const loadCities = async () => {
      const response = await getGwraLocations(selectedState);
      const nextCities = response.cities ?? [];

      setCityOptions(nextCities);
      setSelectedDistrict((current) =>
        current && nextCities.includes(current) ? current : nextCities[0] ?? "",
      );
    };

    loadCities();
  }, [selectedState]);

  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setBlockOptions([]);
      setSelectedBlock("");
      return;
    }

    const loadAssessmentUnits = async () => {
      const response = await getGwraLocations(selectedState, selectedDistrict);
      const nextBlocks = response.assessmentUnits ?? [];

      setBlockOptions(nextBlocks);
      setSelectedBlock((current) =>
        current && nextBlocks.includes(current) ? current : nextBlocks[0] ?? "",
      );
    };

    loadAssessmentUnits();
  }, [selectedState, selectedDistrict]);

  useEffect(() => {
    const buildSuggestions = (city?: string, state?: string) => {
      const place = city || state || "India";
      setSuggestionContextLabel(place);
      setSuggestions(buildLocationSuggestions(place));
      setShowInlineMapOptions(false);

      if (!city && !state) {
        setLocationStatus("denied");
      }

      return place;
    };

    if (!("geolocation" in navigator)) {
      setLocationStatus("denied");
      buildSuggestions(undefined, "Gujarat");
      return;
    }

    const onSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          { headers: { "User-Agent": "ingres-gw-chat/1.0" } },
        );
        const payload = await res.json();

        const addr = payload.address || {};
        const city = (addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.county) as string;
        const state = (addr.state ||
          addr.region ||
          addr["state_district"] ||
          "India") as string;

        setLocation({ city, state, lat: latitude, lng: longitude });
        setLocationStatus("granted");
        buildSuggestions(city, state);
      } catch (err) {
        console.error("Reverse geocoding failed", err);
        setLocationStatus("denied");
        buildSuggestions(undefined, "Gujarat");
      }
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn("Geolocation denied or failed", err);
      setLocationStatus("denied");
      buildSuggestions(undefined, "Gujarat");
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      timeout: 12000,
    });
  }, []);

  const handleMapStateSelect = async (stateName: string, _data?: any) => {
    if (!stateName) return;
    setMapSelection({ state: stateName });

    const userMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      text: stateName,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setLastChartData(null);
    setSuggestionContextLabel(stateName);
    setSuggestions(buildLocationSuggestions(stateName));
    setShowInlineMapOptions(true);

    const botMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      text: `Choose one option for ${stateName}:`,
      sender: "bot",
      timestamp: new Date(),
      options: buildLocationSuggestions(stateName),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const handleMapDistrictSelect = async (
    districtName: string,
    stateName: string,
    _data?: any,
  ) => {
    if (!districtName || !stateName) return;
    setMapSelection({ district: districtName, state: stateName });

    const place = `${districtName}, ${stateName}`;

    const userMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      text: place,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setLastChartData(null);
    setSuggestionContextLabel(place);
    setSuggestions(buildLocationSuggestions(place));
    setShowInlineMapOptions(true);

    const botMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      text: `Choose one option for ${place}:`,
      sender: "bot",
      timestamp: new Date(),
      options: buildLocationSuggestions(place),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const handleMapMessage = (text: string) => {
    const botMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      text,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const isMapModeActive = isMapNeeded;

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
      }
    } catch {}
    navigate("/landing");
  };

  // Mark message as complete (transition from typewriter to HTML)
  const markMessageComplete = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, isNew: false } : msg)),
    );
  };

  // Handle send message - actually call server
  // build a lightweight sql payload from the quick‑chat panel selections
  const buildSqlResponse = () => {
    return {
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      years: [...(year2023 ? ["2023"] : []), ...(year2024 ? ["2024"] : [])],
    };
  };

  const findStateSummary = (stateName?: string) => {
    if (!stateName) return null;

    const stateData = mapStatesDataRef.current;
    const direct = stateData[stateName];
    if (direct) return direct;

    const normalized = normalizeMapName(stateName);
    return (
      Object.values(stateData).find(
        (entry) => normalizeMapName(entry.name) === normalized,
      ) ?? null
    );
  };

  const findDistrictSummary = (districtName?: string, stateName?: string) => {
    if (!districtName || !stateName) return null;

    const districtData = mapDistrictsDataRef.current;
    const direct = districtData[`${districtName}|${stateName}`];
    if (direct) return direct;

    const normalizedDistrict = normalizeMapName(districtName);
    const normalizedState = normalizeMapName(stateName);

    return (
      Object.values(districtData).find(
        (entry) =>
          normalizeMapName(entry.name) === normalizedDistrict &&
          normalizeMapName(entry.state || "") === normalizedState,
      ) ?? null
    );
  };

  const resolveMapQueryPlace = (query: string) => {
    const normalizedQuery = normalizeMapName(query);
    const stateEntries = Object.values(mapStatesDataRef.current);
    const districtEntries = Object.values(mapDistrictsDataRef.current);
    const normalizedLocationCity = normalizeMapName(location?.city || "");

    const matchedState =
      stateEntries.find((entry) =>
        normalizedQuery.includes(normalizeMapName(entry.name)),
      ) ||
      (normalizedLocationCity &&
      normalizedQuery.includes(normalizedLocationCity) &&
      location?.state
        ? findStateSummary(location.state)
        : null) ||
      (mapSelection?.state ? findStateSummary(mapSelection.state) : null);

    if (matchedState) {
      const matchedDistrict =
        districtEntries.find(
          (entry) =>
            normalizeMapName(entry.state || "") ===
              normalizeMapName(matchedState.name) &&
            normalizedQuery.includes(normalizeMapName(entry.name)),
        ) ||
        (mapSelection?.district
          ? findDistrictSummary(mapSelection.district, matchedState.name)
          : null);

      if (matchedDistrict) {
        return {
          requestedPlace: `${matchedDistrict.name}, ${matchedDistrict.state}`,
          districtSummary: matchedDistrict,
          stateSummary: matchedState,
        };
      }

      return {
        requestedPlace: matchedState.name,
        districtSummary: null,
        stateSummary: matchedState,
      };
    }

    const selectedPlace =
      mapSelection?.district && mapSelection?.state
        ? `${mapSelection.district}, ${mapSelection.state}`
        : mapSelection?.state ??
          (location?.city && location?.state
            ? `${location.city}, ${location.state}`
            : location?.state ?? suggestionContextLabel);

    const fallbackPlace =
      query.match(/([A-Za-z .&()-]+,\s*[A-Za-z .&()-]+)\s*$/)?.[1]?.trim() ||
      query.match(/\b(?:of|in)\s+(.+)$/i)?.[1]?.trim() ||
      selectedPlace;

    const districtStateMatch = fallbackPlace.match(/^(.*?),\s*(.+)$/);
    const districtName =
      districtStateMatch?.[1]?.trim() ||
      mapSelection?.district ||
      (normalizedLocationCity && normalizedQuery.includes(normalizedLocationCity)
        ? location?.city
        : undefined);
    const stateName =
      districtStateMatch?.[2]?.trim() ||
      mapSelection?.state ||
      (normalizedLocationCity && normalizedQuery.includes(normalizedLocationCity)
        ? location?.state
        : undefined) ||
      location?.state ||
      fallbackPlace;

    return {
      requestedPlace: fallbackPlace,
      districtSummary:
        districtName && stateName
          ? findDistrictSummary(districtName, stateName)
          : null,
      stateSummary: findStateSummary(stateName),
    };
  };

  const buildMapModeAnswer = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    const isSupportedMapQuery = isSupportedMapQueryText(query);

    if (!isSupportedMapQuery) {
      return null;
    }

    const { requestedPlace, districtSummary, stateSummary } =
      resolveMapQueryPlace(query);
    const summary = districtSummary || stateSummary;
    const placeLabel = districtSummary
      ? `${districtSummary.name}, ${districtSummary.state}`
      : stateSummary?.name || requestedPlace;
    const isDerivedStateSummary =
      !districtSummary &&
      !!stateSummary &&
      derivedStateNamesRef.current.has(stateSummary.name);
    const stateAverageNote = isDerivedStateSummary
      ? " This state-level value is computed as the average of all district entries for that state in **GWRA_MapData.json**."
      : "";

    if (!summary) {
      return `I could not find a matching entry in **GWRA_MapData.json** for **${requestedPlace}**.`;
    }

    if (
      normalizedQuery.includes("groundwater level") ||
      normalizedQuery.includes("groundwater_level")
    ) {
      return `For **${placeLabel}**, **GWRA_MapData.json** does not contain a separate groundwater-level field. The closest available metric is **stage of groundwater extraction = ${formatMapNumber(summary.stage)}%**.${stateAverageNote}`;
    }

    if (
      normalizedQuery.includes("total recharge") ||
      normalizedQuery.includes("total_recharge")
    ) {
      return `For **${placeLabel}**, **total annual groundwater recharge = ${formatMapNumber(summary.recharge, "Ham")}**.${stateAverageNote}`;
    }

    if (normalizedQuery.includes("extractable")) {
      return `For **${placeLabel}**, **annual extractable groundwater resource = ${formatMapNumber(summary.extractable, "Ham")}**.${stateAverageNote}`;
    }

    if (normalizedQuery.includes("extraction")) {
      return `For **${placeLabel}**, **total groundwater extraction = ${formatMapNumber(summary.extraction, "Ham")}**.${stateAverageNote}`;
    }

    if (
      normalizedQuery.includes("stage of groundwater extraction") ||
      normalizedQuery.includes("stage")
    ) {
      return `For **${placeLabel}**, **stage of groundwater extraction = ${formatMapNumber(summary.stage)}%**. This is based on **extraction = ${formatMapNumber(summary.extraction, "Ham")}** and **extractable = ${formatMapNumber(summary.extractable, "Ham")}**.${stateAverageNote}`;
    }

    if (
      normalizedQuery.includes("categorization") ||
      normalizedQuery.includes("category")
    ) {
      return `For **${placeLabel}**, **categorization = ${summary.worstCategory || formatStatusLabel(summary.status)}**.${stateAverageNote}`;
    }

    return null;
  };

  const handleSend = async (overrideText?: string) => {
    if (isMapModeActive && !overrideText) return;

    const textToSend = overrideText?.trim() || inputValue.trim();
    if (!textToSend) return;

    let activeChatId = currentChatId;

    setInputValue("");
    setShowInlineMapOptions(false);
    setSuggestions([]);

    const userMsg: ChatMessageItem = {
      id: Date.now(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Create new chat session if needed (only if user typed in regular flow)
    if (!activeChatId && userId) {
      const newChat = await createNewChatSession(
        userId,
        textToSend.substring(0, 30),
      );
      if (newChat) {
        activeChatId = newChat.chatId;
        setCurrentChatId(activeChatId);
        setChats((prev) => [newChat, ...prev]);
      }
    }

    // Save user message
    if (activeChatId) {
      await saveChatMessage(activeChatId, "user", [{ response: textToSend }]);
    }

    try {
      const shouldUseMapData =
        isMapModeActive && isSupportedMapQueryText(textToSend);

      if (shouldUseMapData && Object.keys(mapStatesDataRef.current).length === 0) {
        const response =
          LOCAL_GWRA_MAP_DATA &&
          Object.keys(LOCAL_GWRA_MAP_DATA.states ?? {}).length > 0
            ? LOCAL_GWRA_MAP_DATA
            : await getGwraMapData();
        const nextDistricts = response.districts ?? {};
        const derivedStates = buildDerivedStateSummaries(nextDistricts);
        const nextStates =
          Object.keys(derivedStates).length > 0
            ? derivedStates
            : response.states ?? {};
        mapStatesDataRef.current = nextStates;
        mapDistrictsDataRef.current = nextDistricts;
        derivedStateNamesRef.current = new Set(Object.keys(derivedStates));
        setMapStatesData(nextStates);
        setMapDistrictsData(nextDistricts);
      }

      const mapModeAnswer =
        shouldUseMapData && buildMapModeAnswer(textToSend);

      if (mapModeAnswer) {
        const botResponse: ChatMessageItem = {
          id: crypto.randomUUID(),
          text: mapModeAnswer,
          sender: "bot",
          timestamp: new Date(),
          isNew: true,
        };

        setLastChartData(null);
        setMessages((prev) => [...prev, botResponse]);

        if (activeChatId) {
          await saveChatMessage(activeChatId, "assistant", [
            {
              response: mapModeAnswer,
              chartData: null,
            },
          ]);

          if (userId) {
            const updatedChats = await getUserChatSessions(userId);
            setChats(updatedChats);
          }
        }

        return;
      }

      const data = await sendChatRequest(
        textToSend,
        isDetailedResponseNeeded,
        isVisualizationNeeded,
      );

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch response");
      }

      const responsePayload = data.response;
      const answerText =
        typeof responsePayload === "string"
          ? responsePayload
          : (responsePayload?.response ??
            "I'm sorry, I received an empty response.");

      const chartData =
        responsePayload && typeof responsePayload === "object"
          ? (responsePayload.chartdata ?? responsePayload.chartData)
          : undefined;

      setLastChartData(chartData ?? null);

      const botResponse = {
        id: crypto.randomUUID(), // More robust unique ID
        text: answerText,
        chartData,
        sender: "bot",
        timestamp: new Date(),
        isNew: true,
      };

      setMessages((prev) => [...prev, botResponse]);

      if (activeChatId) {
        await saveChatMessage(activeChatId, "assistant", [
          {
            response: answerText,
            chartData,
          },
        ]);

        if (userId) {
          const updatedChats = await getUserChatSessions(userId);
          setChats(updatedChats);
        }
      }
    } catch (err) {
      console.error("Send failed", err);
      const fallbackMessage: ChatMessageItem = {
        id: crypto.randomUUID(),
        text: "I could not complete that request from the server, but the map-selection flow is now configured to answer directly from **GWRA_MapData.json** when the query matches the supported groundwater attributes.",
        sender: "bot",
        timestamp: new Date(),
        isNew: true,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
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
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  //For Deleting Chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      setChats((prev) => prev.filter((chat) => chat.chatId !== chatId));

      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete chat failed", err);
    }
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-50 space-x-2">
        {/* <button
          onClick={() => {
            setIsMapPanelOpen((prev) => {
              const next = !prev;
              if (next) setIsMapInitialized(true);
              setIsMapNeeded(next);       // sync, don't invert blindly
              if (next) setSidebarOpen(false);
              return next;
            });
            
          }}
          className={`px-3 py-1 rounded-lg border ${isLightMode ? 'border-slate-200' : 'border-white/20'} bg-white/10 text-xs transition`}
        >
          {isMapPanelOpen ? 'Hide Map' : 'Show Map'}
        </button> */}
      </div>

      <div className="relative flex h-screen w-full overflow-hidden">
        {/* Crossfade gradients — CSS cannot interpolate between distinct gradient definitions */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-radial-light transition-opacity duration-500 ease-out ${isLightMode ? "opacity-100" : "opacity-0"}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-radial transition-opacity duration-500 ease-out ${isLightMode ? "opacity-0" : "opacity-100"}`}
        />
        <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden">
          {/* Floating open-sidebar button (top-left), appears when sidebar is closed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              style={{
                top: "calc(env(safe-area-inset-top, 12px) + 12px)",
                left: "calc(env(safe-area-inset-left, 12px) + 12px)",
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              className={`fixed p-2 rounded-lg backdrop-blur-md focus:outline-none transition-colors duration-500 ease-out ${
                isLightMode
                  ? "bg-slate-200/90 hover:bg-slate-300/90"
                  : "bg-black/40 hover:bg-black/50"
              }`}
            >
              <Menu
                className={`w-5 h-5 transition-colors duration-500 ${isLightMode ? "text-slate-700" : "text-white/80"}`}
              />
            </button>
          )}
          {/* Mobile backdrop — fades in/out with sidebar */}
          <AnimatePresence>
            {sidebarOpen && isMobile && (
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: SIDEBAR_DURATION * 0.85,
                  ease: SIDEBAR_EASE,
                }}
                className="fixed inset-0 z-40 bg-black/35 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
            )}
          </AnimatePresence>

          {/* Sidebar: mobile = slide drawer; desktop = width collapse so main area eases smoothly */}
          {isMobile ? (
            <AnimatePresence mode="sync">
              {sidebarOpen && (
                <motion.aside
                  key="chat-sidebar"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{
                    duration: SIDEBAR_DURATION,
                    ease: SIDEBAR_EASE,
                  }}
                  className={`relative flex flex-col h-full shrink-0 z-50 max-h-screen will-change-transform fixed inset-y-0 left-0 ${
                    isLightMode
                      ? "chat-sidebar-glass-light"
                      : "chat-sidebar-glass-dark"
                  }`}
                  style={{
                    width: `min(100vw, ${sidebarWidthPx}px)`,
                    minWidth: "18rem",
                    maxWidth: "28rem",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <ChatSidebarContent
                    isLightMode={isLightMode}
                    keyboardHeight={keyboardHeight}
                    chats={chats}
                    loadChat={loadChat}
                    handleNewChatClick={handleNewChatClick}
                    editingChatId={editingChatId}
                    setEditingChatId={setEditingChatId}
                    editedName={editedName}
                    setEditedName={setEditedName}
                    setChats={setChats}
                    menuOpenChatId={menuOpenChatId}
                    setMenuOpenChatId={setMenuOpenChatId}
                    setDeleteChatId={setDeleteChatId}
                    onCloseSidebar={() => setSidebarOpen(false)}
                  />
                </motion.aside>
              )}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={false}
              animate={{ width: sidebarOpen ? sidebarWidthPx : 0 }}
              transition={{ duration: SIDEBAR_DURATION, ease: SIDEBAR_EASE }}
              className="relative shrink-0 h-full overflow-hidden z-50 min-w-0"
              style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}
            >
              <aside
                className={`relative flex flex-col h-full max-h-screen will-change-transform ${
                  isLightMode
                    ? "chat-sidebar-glass-light"
                    : "chat-sidebar-glass-dark"
                }`}
                style={{ width: sidebarWidthPx }}
              >
                <ChatSidebarContent
                  isLightMode={isLightMode}
                  keyboardHeight={keyboardHeight}
                  chats={chats}
                  loadChat={loadChat}
                  handleNewChatClick={handleNewChatClick}
                  editingChatId={editingChatId}
                  setEditingChatId={setEditingChatId}
                  editedName={editedName}
                  setEditedName={setEditedName}
                  setChats={setChats}
                  menuOpenChatId={menuOpenChatId}
                  setMenuOpenChatId={setMenuOpenChatId}
                  setDeleteChatId={setDeleteChatId}
                  onCloseSidebar={() => setSidebarOpen(false)}
                />
              </aside>
            </motion.div>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full relative min-w-0">
            {/* Header with user profile and theme toggle */}
            <header
              className={`h-auto glass-panel border-b-0 flex items-center justify-between pr-6 py-4 shrink-0 transition-[background,backdrop-filter,box-shadow,border-color] duration-500 ease-out ${
                sidebarOpen && !isMobile ? "pl-6" : "pl-16"
              }`}
            >
              <div className="flex items-center">
                <h1
                  className={`text-lg font-semibold transition-colors duration-500 ease-out ${
                    isLightMode ? "text-slate-800" : "text-white"
                  }`}
                >
                  INGRES ChatBOT
                  <span className="ml-2 text-xs font-normal text-blue-400">
                    (Jal-Shakti RAG)
                  </span>
                </h1>
              </div>

              {/* Right side: User Profile and Theme Toggle */}
              <div className="flex items-center gap-4">
                {/* Light / Dark mode toggle */}
                <button
                  onClick={() => setIsLightMode((prev) => !prev)}
                  className="inline-flex items-center gap-3 px-2 py-1 rounded-full bg-transparent hover:bg-white/10 transition-colors text-xs font-medium"
                  aria-label="Toggle light mode"
                >
                  {/* Track */}
                  <span
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                      isLightMode ? "bg-slate-300/80" : "bg-blue-600"
                    }`}
                  >
                    {/* Thumb */}
                    <span
                      className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                        isLightMode ? "translate-x-0" : "translate-x-5"
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
                    className={`whitespace-nowrap transition-colors duration-500 ease-out ${
                      isLightMode ? "text-slate-600" : "text-white/70"
                    }`}
                  >
                    {isLightMode ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Chat Column */}
              <div
                className={`flex flex-col ${showDataPanel ? "border-r border-white/5" : ""} transition-all duration-300`}
                style={{ width: isMapPanelOpen ? "50%" : "100%", minWidth: 0 }}
              >
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6"
                  style={{
                    paddingBottom: keyboardHeight
                      ? `${keyboardHeight + 160}px`
                      : undefined,
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-y",
                  }}
                >
                  {isChatLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <OrbitProgress
                        variant="track-disc"
                        speedPlus="0"
                        easing="ease-in"
                        color="#3268cd"
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="min-h-full flex flex-col items-center justify-center px-4 py-10">
                      {/* Logo */}
                      <div className="mb-5">
                        <img
                          src={isLightMode ? logoLight : logoDark}
                          alt="INGRES"
                          className="w-24 h-24 object-contain"
                        />
                      </div>

                      <h2
                        className={`text-3xl font-bold text-center ${isLightMode ? "text-slate-900" : "text-white"} mb-5`}
                      >
                        How can I help you today?
                      </h2>

                      <p
                        className={`text-center max-w-md ${isLightMode ? "text-slate-500" : "text-white/50"} mb-4`}
                      >
                        Ask me anything about India's groundwater resources.
                      </p>

                      {locationStatus !== "pending" && (
                        <p
                          className={`text-center text-sm font-medium mb-5 ${isLightMode ? "text-slate-700" : "text-cyan-100"}`}
                        >
                          📍 Based on your location:{" "}
                          {location?.city
                            ? `${location.city}, ${location.state}`
                            : location?.state || "India"}
                        </p>
                      )}

                      {suggestions.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[800px] w-full">
                          {suggestions.map((suggestion, index) => {
                            const icon =
                              SUGGESTION_ICONS[index % SUGGESTION_ICONS.length];
                            return (
                              <button
                                key={suggestion.label}
                                onClick={() => handleSend(suggestion.prompt)}
                                className={`rounded-2xl border p-5 text-left transition-all duration-200 shadow-sm
${
  isLightMode
    ? "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50"
    : "border-cyan-300/15 bg-[rgba(10,20,40,0.7)] hover:border-cyan-300/80 hover:bg-slate-800/30"
}`}
                              >
                                <div className="text-blue-100">{icon}</div>
                                <div
                                  className={`mt-2 text-base font-semibold ${
                                    isLightMode
                                      ? "text-slate-900"
                                      : "text-white"
                                  }`}
                                >
                                  {suggestion.label}
                                </div>
                                <div
                                  className={`mt-1 text-xs ${
                                    isLightMode
                                      ? "text-slate-500"
                                      : "text-cyan-100/80"
                                  }`}
                                >
                                  {location?.city
                                    ? `${location.city}`
                                    : `${location?.state || "India"}`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-3xl mx-auto">
                      {messages.map((message) => (
                        <React.Fragment key={message.id}>
                          <div
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                          >
                            {message.sender === "bot" && (
                              <div className="w-8 h-8 flex items-center justify-center mr-3 shrink-0">
                                <img
                                  src={isLightMode ? logoLight : logoDark}
                                  alt="bot"
                                  className="w-4 h-4 object-contain"
                                />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] px-5 py-3 ${
                                message.sender === "user"
                                  ? "message-user"
                                  : isLightMode
                                    ? "message-bot-light"
                                    : "message-bot-dark"
                              }`}
                            >
                              {message.text.includes("```") ? (
                                <pre
                                  className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${message.sender === "user" ? "text-white" : isLightMode ? "text-slate-900" : "text-white"} bg-transparent`}
                                >
                                  {message.sender === "bot" ? (
                                    message.isNew ? (
                                      <TypewriterText
                                        text={message.text}
                                        isNew={message.isNew}
                                        onUpdate={scrollToBottom}
                                        onComplete={() =>
                                          markMessageComplete(message.id)
                                        }
                                      />
                                    ) : (
                                      formatMessageText(message.text)
                                    )
                                  ) : (
                                    formatMessageText(message.text)
                                  )}
                                </pre>
                              ) : (
                                <div
                                  className={`text-sm leading-relaxed ${message.sender === "user" ? "text-white" : isLightMode ? "text-slate-900" : "text-white"}`}
                                >
                                  {message.sender === "bot" ? (
                                    message.isNew ? (
                                      <TypewriterText
                                        text={message.text}
                                        isNew={message.isNew}
                                        onUpdate={scrollToBottom}
                                        onComplete={() =>
                                          markMessageComplete(message.id)
                                        }
                                      />
                                    ) : (
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(
                                            message.text,
                                          ),
                                        }}
                                      />
                                    )
                                  ) : (
                                    formatMessageText(message.text)
                                  )}
                                </div>
                              )}
                              <span
                                className={`text-xs mt-2 block ${message.sender === "user" ? "text-white/70" : isLightMode ? "text-slate-500" : "text-white/40"}`}
                              >
                                {formatTime(message.timestamp)}
                              </span>

                              {message.options &&
                                message.options.length > 0 && (
                                  <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                                    {message.options.map(
                                      (option, optionIndex) => (
                                        <button
                                          key={`${message.id}-${option.label}`}
                                          onClick={() =>
                                            handleSend(option.prompt)
                                          }
                                          className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                                            isLightMode
                                              ? "border-slate-200 bg-slate-50 text-slate-800 hover:border-cyan-500 hover:bg-cyan-50"
                                              : "border-white/10 bg-white/5 text-white hover:border-cyan-300/70 hover:bg-white/10"
                                          }`}
                                        >
                                          <div className="flex items-start gap-2">
                                            <span className="text-base leading-none">
                                              {
                                                SUGGESTION_ICONS[
                                                  optionIndex %
                                                    SUGGESTION_ICONS.length
                                                ]
                                              }
                                            </span>
                                            <span className="text-sm leading-5">
                                              {option.label}
                                            </span>
                                          </div>
                                        </button>
                                      ),
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>

                          {message.chartData && (
                            <div
                              key={`${message.id}-chart`}
                              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn my-4`}
                            >
                              <div
                                className={`
        w-full md:max-w-[90%] lg:max-w-[85%] 
        p-4 rounded-2xl border transition-colors duration-500 ease-out
        ${
          message.sender === "user"
            ? "bg-blue-600 border-blue-500 text-white"
            : isLightMode
              ? "bg-white border-slate-200 shadow-sm"
              : "bg-slate-900 border-slate-800"
        }
      `}
                              >
                                {/* Increased height for better readability. 
          The Renderer now fills this container. 
      */}
                                <div className="h-[400px] w-full">
                                  <EChartsRenderer
                                    option={message.chartData}
                                    theme={isLightMode ? "light" : "dark"}
                                  />
                                </div>

                                <div
                                  className={`px-1 flex justify-between items-center mt-3 border-t pt-2 ${
                                    message.sender === "user"
                                      ? "border-white/10"
                                      : "border-slate-100/50"
                                  }`}
                                >
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    Analysis Report
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      message.sender === "user"
                                        ? "text-white/70"
                                        : "opacity-50"
                                    }`}
                                  >
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start animate-fadeIn">
                          <div className="w-8 h-8 flex items-center justify-center mr-3 shrink-0">
                            <img
                              src={isLightMode ? logoLight : logoDark}
                              alt="bot-typing"
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <div
                            className={`px-5 py-4 rounded-2xl rounded-tl-sm flex flex-col gap-2 ${isLightMode ? "message-bot-light" : "message-bot-dark"}`}
                          >
                            {isVisualizationNeeded && (
                              <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 animate-pulse">
                                <BarChart3 className="w-4 h-4" />
                                <span>Fetching data & generating chart...</span>
                              </div>
                            )}
                            <div className="loading-dots">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!showInlineMapOptions && suggestions.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suggestions.map((suggestion, index) => {
                            const icon =
                              SUGGESTION_ICONS[index % SUGGESTION_ICONS.length];
                            return (
                              <button
                                key={`${suggestionContextLabel}-${suggestion.label}`}
                                onClick={() => handleSend(suggestion.prompt)}
                                className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.01] ${
                                  isLightMode
                                    ? "border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50"
                                    : "border-cyan-300/15 bg-[rgba(10,20,40,0.7)] hover:border-cyan-300/80 hover:bg-slate-800/30"
                                }`}
                              >
                                <div className="text-blue-100">{icon}</div>
                                <div
                                  className={`mt-2 text-base font-semibold ${isLightMode ? "text-slate-900" : "text-white"}`}
                                >
                                  {suggestion.label}
                                </div>
                                <div
                                  className={`mt-1 text-xs ${isLightMode ? "text-slate-500" : "text-cyan-100/80"}`}
                                >
                                  {suggestionContextLabel}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div
                  className="p-4 md:p-4 fixed md:static left-0 right-0 z-40"
                  style={{
                    bottom: keyboardHeight
                      ? `${keyboardHeight + 16}px`
                      : "16px",
                    paddingBottom:
                      "calc(env(safe-area-inset-bottom, 12px) + 8px)",
                  }}
                >
                  <div className="max-w-3xl mx-auto px-2">
                    <div
                      className={`rounded-2xl p-2 flex items-center gap-2 ${isLightMode ? "glass-card" : "glass-card-dark"}`}
                    >
                      {/* Plus Button with Mode Dropdown */}
                      <div className="relative" ref={modeDropdownRef}>
                        <button
                          onClick={() => setShowModeDropdown(!showModeDropdown)}
                          className={`p-2.5 rounded-xl transition-colors flex items-center gap-1 ${
                            isLightMode
                              ? "hover:bg-slate-200/80"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <Plus
                            className={`w-5 h-5 ${
                              isLightMode ? "text-slate-500" : "text-white/60"
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                              isLightMode ? "text-slate-400" : "text-white/40"
                            } ${showModeDropdown ? "rotate-180" : ""}`}
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
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 ${
                                  selectedMode.id === mode.id
                                    ? "bg-blue-500/20 border border-blue-500/30"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      selectedMode.id === mode.id
                                        ? "bg-blue-500"
                                        : "bg-white/10"
                                    }`}
                                  >
                                    <mode.icon className="w-4 h-4 text-white" />
                                  </div>

                                  <div className="text-left">
                                    <p
                                      className={`text-sm font-medium ${
                                        selectedMode.id === mode.id
                                          ? "text-white"
                                          : "text-white/80"
                                      }`}
                                    >
                                      {mode.label}
                                    </p>

                                    <p className="text-xs text-white/50">
                                      {mode.description}
                                    </p>
                                  </div>
                                </div>
                                {/* Slidebar only for specific modes */}
                                {mode.id === "deep" && (
                                  <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative inline-flex items-center cursor-pointer ml-3"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isDetailedResponseNeeded}
                                      onChange={(e) =>
                                        setIsDetailedResponseNeeded(
                                          e.target.checked,
                                        )
                                      }
                                      className="sr-only peer"
                                    />

                                    <div
                                      className="w-10 h-5 bg-gray-300 rounded-full peer
      peer-checked:bg-blue-600
      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
      after:bg-white after:border after:rounded-full after:h-4 after:w-4
      after:transition-all peer-checked:after:translate-x-5"
                                    ></div>
                                  </label>
                                )}

                                {mode.id === "visualizer" && (
                                  <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative inline-flex items-center cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isVisualizationNeeded}
                                      onChange={(e) =>
                                        setIsVisualizationNeeded(
                                          e.target.checked,
                                        )
                                      }
                                      className="sr-only peer"
                                    />

                                    <div
                                      className="w-10 h-5 bg-gray-300 rounded-full peer 
        peer-checked:bg-blue-600
        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
        after:bg-white after:border after:rounded-full after:h-4 after:w-4
        after:transition-all peer-checked:after:translate-x-5"
                                    ></div>
                                  </label>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Show AUTO only when nothing else is selected */}
                        {!isDetailedResponseNeeded &&
                          !isVisualizationNeeded && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
                              <Sparkles className="w-4 h-4 text-blue-400" />
                              Auto
                            </div>
                          )}

                        {/* Deep Search badge */}
                        {isDetailedResponseNeeded && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
                            <SearchIcon className="w-4 h-4 text-blue-400" />
                            Deep
                          </div>
                        )}

                        {/* Visualization badge */}
                        {isVisualizationNeeded && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                            Charts
                          </div>
                        )}

                        {/* Map badge */}
                        {isMapNeeded && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
                            <MapIcon className="w-4 h-4 text-blue-400" />
                            Map
                          </div>
                        )}
                      </div>

                      {/* Map Panel Toggle Button */}
                      <button
                        onClick={() => {
                          setIsMapPanelOpen((prev) => {
                            const next = !prev;
                            setIsMapNeeded(next);
                            if (next) {
                              setIsMapInitialized(true);
                              setSidebarOpen(false);
                            } else {
                              setMapSelection(null);
                              setShowInlineMapOptions(false);
                            }
                            return next;
                          });
                        }}
                        className={`p-2.5 rounded-xl transition-colors ${isLightMode ? "hover:bg-slate-200/80" : "hover:bg-white/10"}`}
                        title="Toggle Map"
                      >
                        <MapIcon
                          className={`w-5 h-5 ${isLightMode ? "text-slate-500" : "text-white/60"}`}
                        />
                      </button>

                      {/* Input */}
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        onFocus={() => {
                          // ensure latest messages are visible when keyboard shows
                          setTimeout(
                            () =>
                              messagesEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                              }),
                            50,
                          );
                        }}
                        placeholder={
                          isMapModeActive
                            ? "Custom prompts are temporarily disabled in map mode"
                            : "Type your message..."
                        }
                        disabled={isMapModeActive}
                        className={`flex-1 bg-transparent text-sm py-3 px-2 focus:outline-none ${
                          isLightMode
                            ? "text-slate-800 placeholder:text-slate-400 disabled:text-slate-400 disabled:placeholder:text-slate-400"
                            : "text-white placeholder:text-white/40 disabled:text-white/40 disabled:placeholder:text-white/30"
                        }`}
                      />

                      {/* Send Button */}
                      <button
                        onClick={() => handleSend()}
                        disabled={isMapModeActive || !inputValue.trim()}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                          !isMapModeActive && inputValue.trim()
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : "bg-white/5 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Panel — mounted lazily on first open, then kept alive with CSS visibility */}
              {isMapInitialized && (
                <div
                  className="border-l border-white/10 relative overflow-hidden transition-all duration-300 shrink-0"
                  style={{
                    width: isMapPanelOpen ? "50%" : "0px",
                    minWidth: isMapPanelOpen ? undefined : "0",
                  }}
                  onTransitionEnd={() =>
                    window.dispatchEvent(new Event("resize"))
                  }
                >
                  <IndiaMapComponent
                    onStateSelect={handleMapStateSelect}
                    onDistrictSelect={handleMapDistrictSelect}
                    isVisible={isMapPanelOpen}
                    mapTheme={isLightMode ? "light" : "dark"}
                  />
                </div>
              )}

              {/* Data Query Panel - for Quick Chat mode */}
              {showDataPanel && (
                <div
                  className={`w-96 quick-mode-panel flex flex-col animate-slideIn ${
                    isLightMode
                      ? "quick-mode-panel-light"
                      : "quick-mode-panel-dark"
                  }`}
                >
                  <div className="p-4 border-b border-white/5">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${
                        isLightMode ? "text-slate-700" : "text-white/80"
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
                          isLightMode ? "text-slate-600" : "text-white/60"
                        }`}
                      >
                        State
                      </label>
                      <div className="relative">
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            isLightMode
                              ? "glass-input-light text-slate-800"
                              : "glass-input-quick-dark text-white"
                          }`}
                        >
                          {stateOptions.map((state) => (
                            <option
                              key={state}
                              value={state}
                              className={
                                isLightMode
                                  ? "bg-white text-slate-900"
                                  : "bg-slate-900 text-white"
                              }
                            >
                              {state}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                            isLightMode ? "text-slate-400" : "text-white/40"
                          }`}
                        />
                      </div>
                    </div>

                    {/* District Dropdown */}
                    <div>
                      <label
                        className={`text-sm mb-2 block ${
                          isLightMode ? "text-slate-600" : "text-white/60"
                        }`}
                      >
                        District
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            isLightMode
                              ? "glass-input-light text-slate-800"
                              : "glass-input-quick-dark text-white"
                          }`}
                        >
                          {cityOptions.map((district) => (
                            <option
                              key={district}
                              value={district}
                              className={
                                isLightMode
                                  ? "bg-white text-slate-900"
                                  : "bg-slate-900 text-white"
                              }
                            >
                              {district}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                            isLightMode ? "text-slate-400" : "text-white/40"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Block Dropdown */}
                    <div>
                      <label
                        className={`text-sm mb-2 block ${
                          isLightMode ? "text-slate-600" : "text-white/60"
                        }`}
                      >
                        Block / Assessment Unit
                      </label>
                      <div className="relative">
                        <select
                          value={selectedBlock}
                          onChange={(e) => setSelectedBlock(e.target.value)}
                          className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            isLightMode
                              ? "glass-input-light text-slate-800"
                              : "glass-input-quick-dark text-white"
                          }`}
                        >
                          {blockOptions.map((block) => (
                            <option
                              key={block}
                              value={block}
                              className={
                                isLightMode
                                  ? "bg-white text-slate-900"
                                  : "bg-slate-900 text-white"
                              }
                            >
                              {block}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                            isLightMode ? "text-slate-400" : "text-white/40"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Years */}
                    <div>
                      <label
                        className={`text-sm mb-2 block ${
                          isLightMode ? "text-slate-600" : "text-white/60"
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
                            className={
                              isLightMode
                                ? "custom-checkbox-light"
                                : "custom-checkbox"
                            }
                          />
                          <span
                            className={`text-sm ${
                              isLightMode ? "text-slate-700" : "text-white/80"
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
                            className={
                              isLightMode
                                ? "custom-checkbox-light"
                                : "custom-checkbox"
                            }
                          />
                          <span
                            className={`text-sm ${
                              isLightMode ? "text-slate-700" : "text-white/80"
                            }`}
                          >
                            2024
                          </span>
                        </label>
                      </div>
                      <p
                        className={`text-xs mt-2 ${
                          isLightMode ? "text-slate-400" : "text-white/40"
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
                          <span>{selectedDistrict || "Not selected"}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{selectedBlock || "Not selected"}</span>
                        </div>

                        {/* Data Table */}
                        <div
                          className={`rounded-xl overflow-hidden ${isLightMode ? "glass-card" : "quick-mode-table-dark"}`}
                        >
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
                                  <td
                                    className={
                                      isLightMode
                                        ? "text-slate-800"
                                        : "text-white/80"
                                    }
                                  >
                                    {row.year}
                                  </td>
                                  <td
                                    className={
                                      isLightMode
                                        ? "text-slate-600"
                                        : "text-white/60"
                                    }
                                  >
                                    {row.extractable}
                                  </td>
                                  <td
                                    className={
                                      isLightMode
                                        ? "text-slate-600"
                                        : "text-white/60"
                                    }
                                  >
                                    {row.extraction}
                                  </td>
                                  <td
                                    className={
                                      isLightMode
                                        ? "text-slate-600"
                                        : "text-white/60"
                                    }
                                  >
                                    {row.stage}
                                  </td>
                                  <td>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        row.category === "Safe"
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-yellow-500/20 text-yellow-400"
                                      }`}
                                    >
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
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setShowQuickModal(false)}
                  />
                  <div
                    className={`relative w-full max-w-md mx-auto rounded-xl p-4 z-10 max-h-[90vh] overflow-auto ${
                      isLightMode
                        ? "quick-mode-panel-light"
                        : "quick-mode-panel-dark"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3
                        className={`text-sm font-semibold uppercase tracking-wider ${isLightMode ? "text-slate-800" : "text-white/80"}`}
                      >
                        Quick Chat - Data Query
                      </h3>
                      <button
                        onClick={() => setShowQuickModal(false)}
                        className="p-2 rounded-lg hover:bg-white/5"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          className={`text-sm mb-2 block ${isLightMode ? "text-slate-700" : "text-white/60"}`}
                        >
                          State
                        </label>
                        <div className="relative">
                          <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              isLightMode
                                ? "glass-input-light text-slate-800"
                                : "glass-input-quick-dark text-white"
                            }`}
                          >
                            {stateOptions.map((state) => (
                              <option
                                key={state}
                                value={state}
                                className={
                                  isLightMode
                                    ? "bg-white text-slate-900"
                                    : "bg-slate-900 text-white"
                                }
                              >
                                {state}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? "text-slate-400" : "text-white/40"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`text-sm mb-2 block ${isLightMode ? "text-slate-700" : "text-white/60"}`}
                        >
                          District
                        </label>
                        <div className="relative">
                          <select
                            value={selectedDistrict}
                            onChange={(e) =>
                              setSelectedDistrict(e.target.value)
                            }
                            className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              isLightMode
                                ? "glass-input-light text-slate-800"
                                : "glass-input-quick-dark text-white"
                            }`}
                          >
                            {cityOptions.map((district) => (
                              <option
                                key={district}
                                value={district}
                                className={
                                  isLightMode
                                    ? "bg-white text-slate-900"
                                    : "bg-slate-900 text-white"
                                }
                              >
                                {district}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? "text-slate-400" : "text-white/40"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`text-sm mb-2 block ${isLightMode ? "text-slate-700" : "text-white/60"}`}
                        >
                          Block / Assessment Unit
                        </label>
                        <div className="relative">
                          <select
                            value={selectedBlock}
                            onChange={(e) => setSelectedBlock(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              isLightMode
                                ? "glass-input-light text-slate-800"
                                : "glass-input-quick-dark text-white"
                            }`}
                          >
                            {blockOptions.map((block) => (
                              <option
                                key={block}
                                value={block}
                                className={
                                  isLightMode
                                    ? "bg-white text-slate-900"
                                    : "bg-slate-900 text-white"
                                }
                              >
                                {block}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLightMode ? "text-slate-400" : "text-white/40"}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`text-sm mb-2 block ${isLightMode ? "text-slate-700" : "text-white/60"}`}
                        >
                          Years
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={year2023}
                              onChange={(e) => setYear2023(e.target.checked)}
                              className={
                                isLightMode
                                  ? "custom-checkbox-light"
                                  : "custom-checkbox"
                              }
                            />
                            <span
                              className={`text-sm ${isLightMode ? "text-slate-800" : "text-white/80"}`}
                            >
                              2023
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={year2024}
                              onChange={(e) => setYear2024(e.target.checked)}
                              className={
                                isLightMode
                                  ? "custom-checkbox-light"
                                  : "custom-checkbox"
                              }
                            />
                            <span
                              className={`text-sm ${isLightMode ? "text-slate-800" : "text-white/80"}`}
                            >
                              2024
                            </span>
                          </label>
                        </div>
                        <p
                          className={`text-xs mt-2 ${isLightMode ? "text-slate-500" : "text-white/40"}`}
                        >
                          Select none to use the latest year.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleGetData(); /* keep modal open on mobile so results are visible */
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
                      >
                        Get Data
                      </button>

                      {showResults && (
                        <div className="animate-fadeIn">
                          <div className="flex items-center gap-1 text-xs text-blue-400 mb-4 flex-wrap">
                            <span>{selectedState}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedDistrict || "Not selected"}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedBlock || "Not selected"}</span>
                          </div>

                          <div
                            className={`rounded-xl overflow-hidden ${isLightMode ? "glass-card" : "quick-mode-table-dark"}`}
                          >
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
                                    <td
                                      className={
                                        isLightMode
                                          ? "text-slate-800"
                                          : "text-white/80"
                                      }
                                    >
                                      {row.year}
                                    </td>
                                    <td
                                      className={
                                        isLightMode
                                          ? "text-slate-600"
                                          : "text-white/60"
                                      }
                                    >
                                      {row.extractable}
                                    </td>
                                    <td
                                      className={
                                        isLightMode
                                          ? "text-slate-600"
                                          : "text-white/60"
                                      }
                                    >
                                      {row.extraction}
                                    </td>
                                    <td
                                      className={
                                        isLightMode
                                          ? "text-slate-600"
                                          : "text-white/60"
                                      }
                                    >
                                      {row.stage}
                                    </td>
                                    <td>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          row.category === "Safe"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-yellow-500/20 text-yellow-400"
                                        }`}
                                      >
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

            {deleteChatId && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div
                  className={`rounded-xl p-6 w-80 shadow-xl
          ${
            isLightMode ? "bg-white text-slate-800" : "bg-[#0f172a] text-white"
          }`}
                >
                  <h2 className="text-lg font-semibold mb-4">Delete Chat?</h2>

                  <p className="text-sm font-semi mb-6">
                    This action cannot be undone.
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteChatId(null)}
                      className={`px-4 py-2 rounded-lg
              ${
                isLightMode
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => {
                        handleDeleteChat(deleteChatId);
                        setDeleteChatId(null);
                      }}
                      className={`px-4 py-2 rounded-lg
              ${
                isLightMode
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
export default ChatPage;
