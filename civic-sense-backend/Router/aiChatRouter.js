const express = require('express');
const { chatWithAi } = require('../Controllers/AiChatController');

const router = express.Router();

router.post('/', chatWithAi);

module.exports = router;
