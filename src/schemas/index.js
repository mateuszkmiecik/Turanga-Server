const ObjectId = require('mongodb').ObjectId;

const User = {
    id: ObjectId,
    username: String,
    password: String,
    type: String,
    group: Object
};

const Database = {
    id: ObjectId,
    name: String,
    engine: String,
    url: String,
    user: String,
    password: String,
    dbName: String,
    schemeFile: String
};


const Category = {
    id: ObjectId,
    name: String,
    description: String,
    hidden: Boolean
};


const Task = {
    id: ObjectId,
    name: String,
    description: String,
    correctQuery: String,
    engineDB: Object,
    requiredWords: Array,
    forbiddenWords: Array
};

const Group = {
    id: ObjectId,
    name: String
};

const Exam = {
    id: ObjectId,
    categoryMap: Array,
    timeLimited: Boolean,
    duration: Number,
    examCode: Number
};

const Attempt = {
    id: ObjectId,
    dateStarted: Date,
    examId: ObjectId,
    user: Object,
    tasks: Array,
    lastUpdate: Date,
    duration: Number,
};

const Result = {
    correct: Boolean,
    query: String,
    taskId: ObjectId,
    date: Date
};

const QueryRequest = {
    query: String,
    correctQuery: String,
    requiredWords: Array,
    forbiddenWords: Array,
    dbDetails: Object
};

module.exports = {Database, Group, User, Category, Exercise, Exam, Attempt, Result}