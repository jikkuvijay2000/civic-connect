const express = require("express");
const router = express.Router();
const { addNote, getNotes, deleteNote } = require("../Controllers/NoteController");
const { protect } = require("../Middlewares/authMiddleware");

router.post("/add", protect, addNote);
router.get("/usernotes", protect, getNotes);
router.delete("/delete/:id", protect, deleteNote);

module.exports = { noteRouter: router };
