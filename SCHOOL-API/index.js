import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const TEACHERS_FILE = path.join(__dirname, "teachers.json")
const COURSES_FILE = path.join(__dirname, "courses.json")
const STUDENTS_FILE = path.join(__dirname, "students.json")
const TESTS_FILE = path.join(__dirname, "tests.json")

//helper functions
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parsing", filePath, err);
    return [];
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Load data
let teachers = loadJson(TEACHERS_FILE);
let courses = loadJson(COURSES_FILE);
let students = loadJson(STUDENTS_FILE);
let tests = loadJson(TESTS_FILE);

// Compute next IDs
let nextTeacherId = teachers.reduce((max, t) => Math.max(max, t.id), 0) + 1;
let nextCourseId = courses.reduce((max, c) => Math.max(max, c.id), 0) + 1;
let nextStudentId = students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
let nextTestId = tests.reduce((max, te) => Math.max(max, te.id), 0) + 1;


// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


//Teachers Routes

app.get("/teachers", (req, res) => {
  res.json(teachers);
});

app.get("/teachers/:id", (req, res) => {
  const id = Number(req.params.id);
  const teacher = teachers.find(t => t.id === id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  res.json(teacher);
});


app.post("/teachers", (req, res) => {
  const { firstName, lastName, email, department, room } = req.body;
  if (!firstName || !lastName|| !email|| !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newTeacher = {
    id: nextTeacherId++,
    firstName,
    lastName,
    email,
    department,
    room: room || ""
  };
  teachers.push(newTeacher);
  saveJson(TEACHERS_FILE, teachers);
  res.status(201).json(newTeacher);
});


app.put("/teachers/:id", (req, res) => {
  const id = Number(req.params.id);
  const teacher = teachers.find(t => t.id === id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  const { firstName, lastName, email, department, room } = req.body;
  if (firstName === undefined && 
    lastName === undefined && 
    email === undefined && 
    department === undefined && 
    room === undefined) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
  if (firstName !== undefined) teacher.firstName = firstName;
  if (lastName !== undefined) teacher.lastName = lastName;
  if (email !== undefined) teacher.email = email;
  if (department !== undefined) teacher.department = department;
  if (room !== undefined) teacher.room = room;
  saveJson(TEACHERS_FILE, teachers);
  res.json(teacher);
});


app.delete("/teachers/:id", (req, res) => {
  const id = Number(req.params.id);
  const usedInCourse = courses.some(c => c.teacherId === id);
  if (usedInCourse) {
    return res.status(400).json({
      error: "Cannot delete teacher that is used in course. Delete or update those courses first."
    });
  }
  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  const deleted = teachers.splice(index, 1)[0];
  saveJson(TEACHERS_FILE, teachers);
  res.json(deleted);
});

//Courses Routes

app.get("/courses", (req, res) => {
  res.json(courses);
});

app.get("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  res.json(course);
});


app.post("/courses", (req, res) => {
  const { code, name, teacherId, semester, room, schedule } = req.body;
  if (!code|| !name|| !teacherId|| !semester|| !room) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newCourse = {
    id: nextCourseId++,
    code, 
    name, 
    teacherId: Number(teacherId), 
    semester, 
    room, 
    schedule: schedule || ""
  };
  courses.push(newCourse);
  saveJson(COURSES_FILE, courses);
  res.status(201).json(newCourse);
});


app.put("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const { code, name, teacherId, semester, room, schedule } = req.body;

  // Only error if nothing was sent
  if (code === undefined && 
    name === undefined && 
    teacherId === undefined && 
    semester === undefined && 
    room === undefined &&  
    schedule === undefined) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  // This is the validation the handout is talking about
  if (teacherId !== undefined) {
    const teacher = teachers.find(t => t.id === Number(teacherId));
    if (!teacher) {
      return res
        .status(400)
        .json({ error: "teacherId must be a valid teacher id" });
    }
    course.teacherId = Number(teacherId);
  }

  if (code !== undefined) course.code = code;
  if (name !== undefined) course.name = name;
  if (semester !== undefined) course.semester = semester;
  if (room !== undefined) course.room = room;
  if (schedule !== undefined) course.schedule = schedule;

  saveJson(COURSES_FILE, courses);
  res.json(course);
});



app.delete("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const containsTest = tests.some(te => te.courseId === id);
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete course that contains test. Delete or update your course first."
    });
  }
  const index = courses.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Course not found" });
  }
  const deleted = courses.splice(index, 1)[0];
  saveJson(COURSES_FILE, courses);
  res.json(deleted);
});

// Students Routes
app.get("/students", (req, res) => {
  res.json(students);
});

app.get("/students/:id", (req, res) => {
  const id = Number(req.params.id);
  const student = students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json(student);
});


app.post("/students", (req, res) => {
  const {firstName, lastName, grade, studentNumber, homeroom} = req.body;
  if (!firstName|| !lastName|| !grade|| !studentNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newStudent = {
    id: nextStudentId++,
    firstName, 
    lastName, 
    grade: Number(grade), 
    studentNumber, 
    homeroom: homeroom || ""
  };
  students.push(newStudent);
  saveJson(STUDENTS_FILE, students);
  res.status(201).json(newStudent);
});


app.put("/students/:id", (req, res) => {
  const id = Number(req.params.id);
  const student = students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  const {firstName, lastName, grade, studentNumber, homeroom} = req.body;
  if (    firstName === undefined &&
    lastName === undefined &&
    grade === undefined &&
    studentNumber === undefined &&
    homeroom === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }
  if (firstName !== undefined) student.firstName = firstName;
  if (lastName !== undefined) student.lastName = lastName;
  if (grade !== undefined) student.grade = Number(grade);
  if (studentNumber !== undefined) student.studentNumber = studentNumber;
  if (homeroom !== undefined) student.homeroom = homeroom;
  saveJson(STUDENTS_FILE, students);
  res.json(student);
});


app.delete("/students/:id", (req, res) => {
  const id = Number(req.params.id);
  const containsTest = tests.some(te => te.studentId === id);
  if (containsTest) {
    return res.status(400).json({
      error: "Cannot delete student has test. Delete or update your student first."
    });
  }
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Student not found" });
  }
  const deleted = students.splice(index, 1)[0];
  saveJson(STUDENTS_FILE, students);
  res.json(deleted);
});

// Tests routes 
app.get("/tests", (req, res) => {
  res.json(tests);
});

app.get("/tests/:id", (req, res) => {
  const id = Number(req.params.id);
  const test = tests.find(te => te.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test not found" });
  }
  res.json(test);
});

app.post("/tests", (req, res) => {
  const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;

  // Required fields (weight is OPTIONAL)
  if (
    !studentId ||
    !courseId ||
    !testName ||
    !date ||
    mark === undefined ||
    outOf === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newTest = {
    id: nextTestId++,
    studentId: Number(studentId),
    courseId: Number(courseId),
    testName,
    date,
    mark: Number(mark),
    outOf: Number(outOf),
    weight: weight !== undefined ? Number(weight) : null
  };

  tests.push(newTest);
  saveJson(TESTS_FILE, tests);
  res.status(201).json(newTest);
});

app.put("/tests/:id", (req, res) => {
  const id = Number(req.params.id);
  const test = tests.find(te => te.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test not found" });
  }

  const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;

  // Only error if NOTHING was sent to update
  if (
    studentId === undefined &&
    courseId === undefined &&
    testName === undefined &&
    date === undefined &&
    mark === undefined &&
    outOf === undefined &&
    weight === undefined
  ) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  // Validate studentId only if provided
  if (studentId !== undefined) {
    const student = students.find(s => s.id === Number(studentId));
    if (!student) {
      return res.status(400).json({ error: "studentId must be a valid student id" });
    }
    test.studentId = Number(studentId);
  }

  // Validate courseId only if provided
  if (courseId !== undefined) {
    const course = courses.find(c => c.id === Number(courseId));
    if (!course) {
      return res.status(400).json({ error: "courseId must be a valid course id" });
    }
    test.courseId = Number(courseId);
  }

  if (testName !== undefined) test.testName = testName;
  if (date !== undefined) test.date = date;
  if (mark !== undefined) test.mark = Number(mark);
  if (outOf !== undefined) test.outOf = Number(outOf);
  if (weight !== undefined) test.weight = Number(weight);

  saveJson(TESTS_FILE, tests);
  res.json(test);
});

app.delete("/tests/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tests.findIndex(te => te.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Test not found" });
  }
  const deleted = tests.splice(index, 1)[0];
  saveJson(TESTS_FILE, tests);
  res.json(deleted);
});
