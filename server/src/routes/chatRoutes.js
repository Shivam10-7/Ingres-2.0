const express = require("express");
const router = express.Router();
const Chat = require("./middleware/models/Chat");
// Ensure authentication middleware is configured beforehand if needed,, e.g. using AuthJwt
// We assume `req.user` contains the authenticated user's ID if AuthJwt is used.

// Create New Chat
// POST /api/chats
router.post("/", async (req, res) => {
  try {
    const { userId, chatName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Generate a unique chatId
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newChat = new Chat({
      userId,
      chatId,
      chatName: chatName || "New Chat",
      messages: [],
    });

    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Get All User Chats
// GET /api/chats/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch chats for the user, sorting by most recently updated
    const chats = await Chat.find({ userId })
      .select("chatId chatName updatedAt")
      .sort({ updatedAt: -1 });
      
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Failed to fetch user chats" });
  }
});

// Get Chat Messages
// GET /api/chats/messages/:chatId
router.get("/messages/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

// Add Message
// POST /api/chats/message
router.post("/message", async (req, res) => {
  try {
    const { chatId, role, content } = req.body;

    if (!chatId || !role || !content) {
      return res.status(400).json({ error: "chatId, role, and content are required" });
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const newMessage = {
      role,
      content,
    };

    chat.messages.push(newMessage);
    
    // Auto-rename chat if it's the first user message and the title is default
    if (chat.messages.length === 1 && role === "user" && chat.chatName === "New Chat") {
      // Simplified auto-naming (take first 30 chars of the message)
      // In a real app, you might want to ask an LLM to summarize the title.
      chat.chatName = content.substring(0, 30) + (content.length > 30 ? "..." : "");
    }

    const updatedChat = await chat.save();
    
    res.status(200).json(updatedChat);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

module.exports = router;
