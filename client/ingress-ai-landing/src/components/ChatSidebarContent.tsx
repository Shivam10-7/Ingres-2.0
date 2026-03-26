import React from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  X,
  MoreVertical,
} from 'lucide-react';
import UserProfile from '@/components/UserProfile';
import { ChatSession, renameChatSession } from '@/lib/api';

const logoLight = '/logo_LIGHT.png';
const logoDark = '/logo_DARK.png';

export type ChatSidebarContentProps = {
  isLightMode: boolean;
  keyboardHeight: number;
  chats: ChatSession[];
  loadChat: (chatId: string) => void;
  handleNewChatClick: () => void;
  editingChatId: string | null;
  setEditingChatId: (id: string | null) => void;
  editedName: string;
  setEditedName: (v: string) => void;
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentChatId: string | null;
  menuOpenChatId: string | null;
  setMenuOpenChatId: (id: string | null) => void;
  setDeleteChatId: (id: string | null) => void;
  onCloseSidebar: () => void;
};

export function ChatSidebarContent({
  isLightMode,
  keyboardHeight,
  chats,
  loadChat,
  handleNewChatClick,
  editingChatId,
  setEditingChatId,
  editedName,
  setEditedName,
  setChats,
  currentChatId,
  menuOpenChatId,
  setMenuOpenChatId,
  setDeleteChatId,
  onCloseSidebar,
}: ChatSidebarContentProps) {
  return (
    <>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src={isLightMode ? logoLight : logoDark} alt="INGRES" className="w-6 h-6 object-contain" />
        </div>
        <span className={`text-xl font-semibold tracking-tight ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
          INGRES
        </span>
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={handleNewChatClick}
          className={`w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 group ${
            isLightMode
              ? 'glass-card-light text-slate-800 hover:bg-slate-50'
              : 'glass-card-dark text-white hover:bg-white/10'
          }`}
        >
          <Plus className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`} />
          <span className="font-medium">New chat</span>
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightMode ? 'text-slate-400' : 'text-white/50'}`} />
          <input
            type="text"
            placeholder="Search chats..."
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isLightMode
                ? 'glass-input-light text-slate-800 placeholder:text-slate-400'
                : 'glass-input text-white placeholder:text-white/40'
            }`}
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-2"
        style={{
          paddingBottom: keyboardHeight ? `${keyboardHeight + 120}px` : undefined,
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="px-3 py-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-white/40'}`}>
            Recent
          </span>
        </div>
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat._id}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                currentChatId === chat.chatId
                  ? (isLightMode ? 'bg-slate-200/50 border-blue-500/50 shadow-sm' : 'bg-white/10 border-blue-400/50 shadow-sm')
                  : (isLightMode ? 'border-transparent hover:bg-slate-200/70' : 'border-transparent hover:bg-white/5')
              }`}
            >
              <button onClick={() => loadChat(chat.chatId)} className="flex items-center gap-3 flex-1 text-left">
                <MessageSquare
                  className={`w-4 h-4 shrink-0 group-hover:text-blue-500 ${isLightMode ? 'text-slate-400' : 'text-white/40'}`}
                />

                {editingChatId === chat.chatId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editedName}
                      autoFocus
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-transparent border-b border-blue-400 outline-none text-sm flex-1"
                    />
                    <button
                      onClick={async () => {
                        await renameChatSession(chat.chatId, editedName);
                        setChats((prev) =>
                          prev.map((c) => (c.chatId === chat.chatId ? { ...c, chatName: editedName } : c))
                        );
                        setEditingChatId(null);
                      }}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      ✓
                    </button>
                    <button onClick={() => setEditingChatId(null)} className="text-red-400 hover:text-red-300 text-sm">
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm truncate flex-1 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    {chat.chatName}
                  </span>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenChatId(menuOpenChatId === chat.chatId ? null : chat.chatId);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical
                  className={`w-4 h-4 ${isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white'}`}
                />
              </button>

              {menuOpenChatId === chat.chatId && (
                <div
                  className={`absolute right-2 top-8 rounded-lg shadow-lg z-50 border ${
                    isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-black border-white/10 text-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      setEditingChatId(chat.chatId);
                      setEditedName(chat.chatName);
                      setMenuOpenChatId(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setDeleteChatId(chat.chatId)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isLightMode ? 'hover:bg-red-100 text-red-600' : 'hover:bg-red-500/20 text-red-400'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <UserProfile isLightMode={isLightMode} />
      <button
        onClick={onCloseSidebar}
        className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-slate-200' : 'hover:bg-white/5'}`}
        aria-label="Close sidebar"
      >
        <X className={`w-4 h-4 ${isLightMode ? 'text-slate-500' : 'text-white/60'}`} />
      </button>
    </>
  );
}
