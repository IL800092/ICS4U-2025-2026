import express from "express";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { connectToDB, getDB } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("School API running. Try /students, /teachers, /courses, /tests");
});

/* ---------- helpers ---------- */
function toObjectId(idStr) {
  if (!ObjectId.isValid(idStr)) return null;
  return new ObjectId(idStr);
}

/* -------------------- TEACHERS -------------------- */
app.get("/teachers", async (req, res) => {
  const db = getDB();
  const teachers = await db.collection("teachers").find({}).toArray();
  res.json(teachers);
});

app.get("/teachers/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher _id" });

  const teacher = await db.collection("teachers").findOne({ _id });
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  res.json(teacher);
});

app.post("/teachers", async (req, res) => {
  const db = getDB();
  const { firstName, lastName, email, department, room, id } = req.body;

  if (!firstName || !lastName || !email || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newTeacher = {
    firstName,
    lastName,
    email,
    department,
    room: room || ""
  };

  // Keep your old numeric id if you want
  if (id !== undefined) newTeacher.id = Number(id);

  const result = await db.collection("teachers").insertOne(newTeacher);
  const created = await db.collection("teachers").findOne({ _id: result.insertedId });

  res.status(201).json(created);
});

app.put("/teachers/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher _id" });

  const { firstName, lastName, email, department, room } = req.body;

  if (
    firstName === undefined &&
    lastName === undefined &&
    email === undefined &&
    department === undefined &&
    room === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (email !== undefined) updates.email = email;
  if (department !== undefined) updates.department = department;
  if (room !== undefined) updates.room = room;

  const updated = await db.collection("teachers").findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ error: "Teacher not found" });
  res.json(updated);
});

app.delete("/teachers/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid teacher _id" });

  const usedInCourse = await db.collection("courses").findOne({ teacher_id: _id });
  if (usedInCourse) {
    return res.status(400).json({
      error: "Cannot delete teacher used by a course. Update or delete those courses first."
    });
  }

  const deleted = await db.collection("teachers").findOneAndDelete({ _id });
  if (!deleted) return res.status(404).json({ error: "Teacher not found" });

  res.json(deleted);
});

/* -------------------- COURSES -------------------- */
app.get("/courses", async (req, res) => {
  const db = getDB();
  const courses = await db.collection("courses").find({}).toArray();
  res.json(courses);
});

app.get("/courses/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid course _id" });

  const course = await db.collection("courses").findOne({ _id });
  if (!course) return res.status(404).json({ error: "Course not found" });

  res.json(course);
});

app.post("/courses", async (req, res) => {
  const db = getDB();
  const { code, name, teacher_id, teacherId, semester, room, schedule, id } = req.body;

  if (!code || !name || !semester || !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Accept teacher_id as ObjectId string
  let tId = null;
  if (teacher_id) tId = toObjectId(teacher_id);

  if (!tId && teacherId !== undefined) {
    // optional fallback if you still send old numeric teacherId
    const t = await db.collection("teachers").findOne({ id: Number(teacherId) });
    if (t) tId = t._id;
  }

  if (!tId) return res.status(400).json({ error: "teacher_id must be a valid teacher _id" });

  const teacherExists = await db.collection("teachers").findOne({ _id: tId });
  if (!teacherExists) return res.status(400).json({ error: "teacher_id must be a valid teacher _id" });

  const newCourse = {
    code,
    name,
    teacher_id: tId,
    semester,
    room,
    schedule: schedule || ""
  };

  // Keep old numeric ids if your teacher wants you to preserve them
  if (id !== undefined) newCourse.id = Number(id);
  if (teacherId !== undefined) newCourse.teacherId = Number(teacherId);

  const result = await db.collection("courses").insertOne(newCourse);
  const created = await db.collection("courses").findOne({ _id: result.insertedId });

  res.status(201).json(created);
});

app.put("/courses/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid course _id" });

  const { code, name, teacher_id, semester, room, schedule } = req.body;

  if (
    code === undefined &&
    name === undefined &&
    teacher_id === undefined &&
    semester === undefined &&
    room === undefined &&
    schedule === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  const updates = {};
  if (teacher_id !== undefined) {
    const tId = toObjectId(teacher_id);
    if (!tId) return res.status(400).json({ error: "Invalid teacher_id" });

    const teacherExists = await db.collection("teachers").findOne({ _id: tId });
    if (!teacherExists) return res.status(400).json({ error: "teacher_id must be a valid teacher _id" });

    updates.teacher_id = tId;
  }

  if (code !== undefined) updates.code = code;
  if (name !== undefined) updates.name = name;
  if (semester !== undefined) updates.semester = semester;
  if (room !== undefined) updates.room = room;
  if (schedule !== undefined) updates.schedule = schedule;

  const updated = await db.collection("courses").findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ error: "Course not found" });
  res.json(updated);
});

app.delete("/courses/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid course _id" });

  const containsTest = await db.collection("tests").findOne({ course_id: _id });
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete course that has tests. Delete or update those tests first."
    });
  }

  const deleted = await db.collection("courses").findOneAndDelete({ _id });
  if (!deleted) return res.status(404).json({ error: "Course not found" });

  res.json(deleted);
});

/* -------------------- STUDENTS -------------------- */
app.get("/students", async (req, res) => {
  const db = getDB();
  const students = await db.collection("students").find({}).toArray();
  res.json(students);
});

app.get("/students/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid student _id" });

  const student = await db.collection("students").findOne({ _id });
  if (!student) return res.status(404).json({ error: "Student not found" });

  res.json(student);
});

app.post("/students", async (req, res) => {
  const db = getDB();
  const { firstName, lastName, grade, studentNumber, homeroom, id } = req.body;

  if (!firstName || !lastName || grade === undefined || !studentNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newStudent = {
    firstName,
    lastName,
    grade: Number(grade),
    studentNumber,
    homeroom: homeroom || ""
  };

  if (id !== undefined) newStudent.id = Number(id);

  const result = await db.collection("students").insertOne(newStudent);
  const created = await db.collection("students").findOne({ _id: result.insertedId });

  res.status(201).json(created);
});

app.put("/students/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid student _id" });

  const { firstName, lastName, grade, studentNumber, homeroom } = req.body;

  if (
    firstName === undefined &&
    lastName === undefined &&
    grade === undefined &&
    studentNumber === undefined &&
    homeroom === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (grade !== undefined) updates.grade = Number(grade);
  if (studentNumber !== undefined) updates.studentNumber = studentNumber;
  if (homeroom !== undefined) updates.homeroom = homeroom;

  const updated = await db.collection("students").findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ error: "Student not found" });
  res.json(updated);
});

app.delete("/students/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid student _id" });

  const containsTest = await db.collection("tests").findOne({ student_id: _id });
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete student that has tests. Delete or update those tests first."
    });
  }

  const deleted = await db.collection("students").findOneAndDelete({ _id });
  if (!deleted) return res.status(404).json({ error: "Student not found" });

  res.json(deleted);
});

/* -------------------- TESTS -------------------- */
app.get("/tests", async (req, res) => {
  const db = getDB();
  const tests = await db.collection("tests").find({}).toArray();
  res.json(tests);
});

app.get("/tests/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid test _id" });

  const test = await db.collection("tests").findOne({ _id });
  if (!test) return res.status(404).json({ error: "Test not found" });

  res.json(test);
});

app.post("/tests", async (req, res) => {
  const db = getDB();
  const { student_id, course_id, testName, date, mark, outOf, weight, id } = req.body;

  if (!student_id || !course_id || !testName || !date || mark === undefined || outOf === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sId = toObjectId(student_id);
  const cId = toObjectId(course_id);
  if (!sId) return res.status(400).json({ error: "Invalid student_id" });
  if (!cId) return res.status(400).json({ error: "Invalid course_id" });

  const studentExists = await db.collection("students").findOne({ _id: sId });
  if (!studentExists) return res.status(400).json({ error: "student_id must be a valid student _id" });

  const courseExists = await db.collection("courses").findOne({ _id: cId });
  if (!courseExists) return res.status(400).json({ error: "course_id must be a valid course _id" });

  const newTest = {
    student_id: sId,
    course_id: cId,
    testName,
    date,
    mark: Number(mark),
    outOf: Number(outOf),
    weight: weight !== undefined ? Number(weight) : null
  };

  if (id !== undefined) newTest.id = Number(id);

  const result = await db.collection("tests").insertOne(newTest);
  const created = await db.collection("tests").findOne({ _id: result.insertedId });

  res.status(201).json(created);
});

app.put("/tests/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid test _id" });

  const { student_id, course_id, testName, date, mark, outOf, weight } = req.body;

  if (
    student_id === undefined &&
    course_id === undefined &&
    testName === undefined &&
    date === undefined &&
    mark === undefined &&
    outOf === undefined &&
    weight === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  const updates = {};

  if (student_id !== undefined) {
    const sId = toObjectId(student_id);
    if (!sId) return res.status(400).json({ error: "Invalid student_id" });
    const studentExists = await db.collection("students").findOne({ _id: sId });
    if (!studentExists) return res.status(400).json({ error: "student_id must be a valid student _id" });
    updates.student_id = sId;
  }

  if (course_id !== undefined) {
    const cId = toObjectId(course_id);
    if (!cId) return res.status(400).json({ error: "Invalid course_id" });
    const courseExists = await db.collection("courses").findOne({ _id: cId });
    if (!courseExists) return res.status(400).json({ error: "course_id must be a valid course _id" });
    updates.course_id = cId;
  }

  if (testName !== undefined) updates.testName = testName;
  if (date !== undefined) updates.date = date;
  if (mark !== undefined) updates.mark = Number(mark);
  if (outOf !== undefined) updates.outOf = Number(outOf);
  if (weight !== undefined) updates.weight = weight === null ? null : Number(weight);

  const updated = await db.collection("tests").findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!updated) return res.status(404).json({ error: "Test not found" });
  res.json(updated);
});

app.delete("/tests/:id", async (req, res) => {
  const db = getDB();
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ error: "Invalid test _id" });

  const deleted = await db.collection("tests").findOneAndDelete({ _id });
  if (!deleted) return res.status(404).json({ error: "Test not found" });

  res.json(deleted);
});

/* -------------------- EXTRA ENDPOINTS -------------------- */
app.get("/students/:id/tests", async (req, res) => {
  const db = getDB();
  const student_id = toObjectId(req.params.id);
  if (!student_id) return res.status(400).json({ error: "Invalid student _id" });

  const student = await db.collection("students").findOne({ _id: student_id });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const studentTests = await db.collection("tests").find({ student_id }).toArray();
  res.json(studentTests);
});

app.get("/courses/:id/tests", async (req, res) => {
  const db = getDB();
  const course_id = toObjectId(req.params.id);
  if (!course_id) return res.status(400).json({ error: "Invalid course _id" });

  const course = await db.collection("courses").findOne({ _id: course_id });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const courseTests = await db.collection("tests").find({ course_id }).toArray();
  res.json(courseTests);
});

app.get("/students/:id/average", async (req, res) => {
  const db = getDB();
  const student_id = toObjectId(req.params.id);
  if (!student_id) return res.status(400).json({ error: "Invalid student _id" });

  const student = await db.collection("students").findOne({ _id: student_id });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const studentTests = await db.collection("tests").find({ student_id }).toArray();
  if (studentTests.length === 0) return res.status(404).json({ error: "No tests found for this student" });

  const totalPercent = studentTests.reduce((sum, te) => sum + (te.mark / te.outOf) * 100, 0);
  const average = totalPercent / studentTests.length;

  res.json({ student_id, average: Number(average.toFixed(2)), testCount: studentTests.length });
});

app.get("/courses/:id/average", async (req, res) => {
  const db = getDB();
  const course_id = toObjectId(req.params.id);
  if (!course_id) return res.status(400).json({ error: "Invalid course _id" });

  const course = await db.collection("courses").findOne({ _id: course_id });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const courseTests = await db.collection("tests").find({ course_id }).toArray();
  if (courseTests.length === 0) return res.status(404).json({ error: "No tests found for this course" });

  const totalPercent = courseTests.reduce((sum, te) => sum + (te.mark / te.outOf) * 100, 0);
  const average = totalPercent / courseTests.length;

  res.json({ course_id, average: Number(average.toFixed(2)), testCount: courseTests.length });
});

// Start after DB connects
async function start() {
  await connectToDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

