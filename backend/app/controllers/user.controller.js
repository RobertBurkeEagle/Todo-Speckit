import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;

const parseUserId = (rawId) => parseInt(rawId, 10);

const profilePayload = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const exports = {};

exports.findOne = async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "User id is invalid." });
    }

    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return res.status(404).send({ message: `User with id=${id} not found.` });
    }

    return res.send(profilePayload(user));
  } catch (err) {
    logger.error(`Find user failed: ${err.message}`);
    return res.status(500).send({ message: "Could not retrieve user." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseUserId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "User id is invalid." });
    }

    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return res.status(404).send({ message: `User with id=${id} not found.` });
    }

    const { fName, lName, email, username, password } = req.body;

    if (!fName?.trim()) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName?.trim()) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!username?.trim()) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (password && password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const existingUsername = await db.user.findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername && existingUsername.id !== user.id) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: { email: trimmedEmail },
    });
    if (existingEmail && existingEmail.id !== user.id) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const scopedUser = await db.user.unscoped().findByPk(user.id);
    scopedUser.fName = fName.trim();
    scopedUser.lName = lName.trim();
    scopedUser.email = trimmedEmail;
    scopedUser.username = normalizedUsername;

    if (password) {
      scopedUser.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await scopedUser.save();
    const updated = await db.user.findByPk(user.id);
    return res.send(profilePayload(updated));
  } catch (err) {
    logger.error(`Update user failed: ${err.message}`);
    return res.status(500).send({ message: "Could not update user." });
  }
};

export default exports;
