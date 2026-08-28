import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const MAX_TODO_TITLE_LENGTH = 255;

const parseId = (rawId) => parseInt(rawId, 10);

const validateTitle = (title) => {
  if (typeof title !== "string" || !title.trim()) {
    return { message: "Todo title is required." };
  }
  if (title.trim().length > MAX_TODO_TITLE_LENGTH) {
    return { message: "Todo title must be 255 characters or fewer." };
  }
  return null;
};

const todoOrder = [
  ["completed", "ASC"],
  ["createdAt", "ASC"],
];

const exports = {};

exports.findAllForList = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: todoOrder,
    });
    return res.send(todos);
  } catch (err) {
    logger.error(`Find todos failed: ${err.message}`);
    return res.status(500).send({ message: "Could not retrieve todos." });
  }
};

exports.createForList = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "List id is invalid." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const titleError = validateTitle(req.body?.title);
    if (titleError) {
      return res.status(400).send(titleError);
    }

    const todo = await db.todo.create({
      title: req.body.title.trim(),
      listId,
      userId: req.user.id,
      completed: false,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Create todo failed: ${err.message}`);
    return res.status(500).send({ message: "Could not create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Todo id is invalid." });
    }

    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const titleError = validateTitle(req.body.title);
      if (titleError) {
        return res.status(400).send(titleError);
      }
      todo.title = req.body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.send(todo);
  } catch (err) {
    logger.error(`Update todo failed: ${err.message}`);
    return res.status(500).send({ message: "Could not update todo." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Todo id is invalid." });
    }

    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo deleted." });
  } catch (err) {
    logger.error(`Delete todo failed: ${err.message}`);
    return res.status(500).send({ message: "Could not delete todo." });
  }
};

export default exports;
