import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const MAX_LIST_NAME_LENGTH = 100;

const parseListId = (rawId) => parseInt(rawId, 10);

const validateListName = (name) => {
  if (typeof name !== "string" || !name.trim()) {
    return { message: "List name is required." };
  }
  if (name.trim().length > MAX_LIST_NAME_LENGTH) {
    return { message: "List name must be 100 characters or fewer." };
  }
  return null;
};

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(lists);
  } catch (err) {
    logger.error(`Find lists failed: ${err.message}`);
    return res.status(500).send({ message: "Could not retrieve lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const nameError = validateListName(req.body?.name);
    if (nameError) {
      return res.status(400).send(nameError);
    }

    const list = await db.list.create({
      name: req.body.name.trim(),
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`Create list failed: ${err.message}`);
    return res.status(500).send({ message: "Could not create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseListId(req.params.listId);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const nameError = validateListName(req.body?.name);
    if (nameError) {
      return res.status(400).send(nameError);
    }

    const list = await getAccessibleListOrNull(req, id);
    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    list.name = req.body.name.trim();
    await list.save();
    return res.send(list);
  } catch (err) {
    logger.error(`Update list failed: ${err.message}`);
    return res.status(500).send({ message: "Could not update list." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseListId(req.params.listId);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, id);
    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    await list.destroy();
    return res.status(200).send({ message: "List deleted." });
  } catch (err) {
    logger.error(`Delete list failed: ${err.message}`);
    return res.status(500).send({ message: "Could not delete list." });
  }
};

export default exports;
