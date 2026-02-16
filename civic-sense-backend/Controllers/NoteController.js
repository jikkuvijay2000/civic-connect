const Note = require("../Models/Note");

const addNote = async (req, res) => {
    try {
        const { content, date } = req.body;
        const userId = req.user._id;

        if (!content || !date) {
            return res.status(400).json({ message: "Content and date are required" });
        }

        const newNote = new Note({
            userId,
            content,
            date: new Date(date)
        });

        await newNote.save();
        res.status(201).json({ status: "success", data: newNote });

    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getNotes = async (req, res) => {
    try {
        const userId = req.user._id;
        const notes = await Note.find({ userId }).sort({ date: 1 });
        res.status(200).json({ status: "success", data: notes });
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const userId = req.user._id;
        const noteId = req.params.id;

        const note = await Note.findOneAndDelete({ _id: noteId, userId });

        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        res.status(200).json({ status: "success", message: "Note deleted" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { addNote, getNotes, deleteNote };
