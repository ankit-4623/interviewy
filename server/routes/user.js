
const express = require('express');
const getUser = require('../controllers/userControllers');
const route = express.Router();

route.get('/get/:id',getUser)
module.exports = route;