const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: [
      {
        response: {
          type: mongoose.Schema.Types.Mixed,
          required: false
        },
        chartData: {
          type: mongoose.Schema.Types.Mixed,
          required: false
        }
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatId: {
      type: String,
      required: true,
      unique: true,
    },
    chatName: {
      type: String,
      required: true,
      default: "New Chat",
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);