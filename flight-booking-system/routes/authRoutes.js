const express = require("express");
const router = express.Router();
const { showLogin, showRegister, login, register, logout } = require("../controllers/authController");

router.get("/login", showLogin);
router.post("/login", login);
router.get("/register", showRegister);
router.post("/register", register);
router.post("/logout", logout);

module.exports = router;
