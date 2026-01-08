import express from "express";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { connectToDB, getDB } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ---------- helpers ---------- */
function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

const asyncHandler =
  (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- root ---------- */
app.get("/", (req, res) => {
  res.status(200).send("School API running");
});

/* ================= TEACHERS ================= */
app.get("/teachers", asyncHandler(async (req, res) => {
  const db = getDB();
  res.status(200).json(await db.collection("teachers").find().toArray());
}));

app.get("/teachers/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher id" });

  const teacher = await getDB().collection("teachers").findOne({ _id });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  res.status(200).json(teacher);
}));

app.post("/teachers", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, department, room, id } = req.body;
  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const teacher = { firstName, lastName, email, department, room: room || "" };
  if (id !== undefined) teacher.id = Number(id);

  const result = await getDB().collection("teachers").insertOne(teacher);
  res.status(201).json({ _id: result.insertedId, ...teacher });
}));

app.put("/teachers/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher id" });

  const result = await getDB().collection("teachers").findOneAndUpdate(
    { _id },
    { $set: req.body },
    { returnDocument: "after" }
  );

  if (!result.value) return res.status(404).json({ error: "Teacher not found" });
  res.status(200).json(result.value);
}));

app.delete("/teachers/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher id" });

  const used = await getDB().collection("courses").findOne({ teacher_id: _id });
  if (used) return res.status(409).json({ error: "Teacher is used by a course" });

  const result = await getDB().collection("teachers").deleteOne({ _id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Teacher not found" });

  res.sendStatus(204);
}));

/* ================= COURSES ================= */
app.get("/courses", asyncHandler(async (req, res) => {
  res.status(200).json(await getDB().collection("courses").find().toArray());
}));

app.post("/courses", asyncHandler(async (req, res) => {
  const { code, name, teacher_id, semester, room, schedule, id } = req.body;
  if (!code || !name || !teacher_id || !semester || !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const tId = toObjectId(teacher_id);
  if (!tId) return res.status(400).json({ error: "Invalid teacher_id" });

  const exists = await getDB().collection("teachers").findOne({ _id: tId });
  if (!exists) return res.status(400).json({ error: "Teacher not found" });

  const course = { code, name, teacher_id: tId, semester, room, schedule: schedule || "" };
  if (id !== undefined) course.id = Number(id);

  const result = await getDB().collection("courses").insertOne(course);
  res.status(201).json({ _id: result.insertedId, ...course });
}));

app.delete("/courses/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid course id" });

  const used = await getDB().collection("tests").findOne({ course_id: _id });
  if (used) return res.status(409).json({ error: "Course has tests" });

  const result = await getDB().collection("courses").deleteOne({ _id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Course not found" });

  res.sendStatus(204);
}));

/* ================= STUDENTS ================= */
app.get("/students", asyncHandler(async (req, res) => {
  res.status(200).json(await getDB().collection("students").find().toArray());
}));

app.post("/students", asyncHandler(async (req, res) => {
  const { firstName, lastName, grade, studentNumber, homeroom, id } = req.body;
  if (!firstName || !lastName || grade === undefined || !studentNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const student = { firstName, lastName, grade, studentNumber, homeroom: homeroom || "" };
  if (id !== undefined) student.id = Number(id);

  const result = await getDB().collection("students").insertOne(student);
  res.status(201).json({ _id: result.insertedId, ...student });
}));

app.delete("/students/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid student id" });

  const used = await getDB().collection("tests").findOne({ student_id: _id });
  if (used) return res.status(409).json({ error: "Student has tests" });

  const result = await getDB().collection("students").deleteOne({ _id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Student not found" });

  res.sendStatus(204);
}));

/* ================= TESTS ================= */
app.get("/tests", asyncHandler(async (req, res) => {
  res.status(200).json(await getDB().collection("tests").find().toArray());
}));

app.post("/tests", asyncHandler(async (req, res) => {
  const { student_id, course_id, testName, date, mark, outOf, weight } = req.body;
  if (!student_id || !course_id || !testName || !date || mark === undefined || outOf === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sId = toObjectId(student_id);
  const cId = toObjectId(course_id);
  if (!sId || !cId) return res.status(400).json({ error: "Invalid ids" });

  const test = { student_id: sId, course_id: cId, testName, date, mark, outOf, weight: weight ?? null };
  const result = await getDB().collection("tests").insertOne(test);

  res.status(201).json({ _id: result.insertedId, ...test });
}));

app.delete("/tests/:id", asyncHandler(async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid test id" });

  const result = await getDB().collection("tests").deleteOne({ _id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Test not found" });

  res.sendStatus(204);
}));

/* ---------- error handler ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

/* ---------- start ---------- */
async function start() {
  await connectToDB();
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

start();
