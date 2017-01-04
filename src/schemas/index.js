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
    description: String,
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
    private: Boolean
};


const Exercise = {
    id: ObjectId,
    title: String,
    description: String,
    correctQuery: String,
    engineDB: Object,
    allowedWords: Array,
    restrictedWords: Array
};

const Group = {
    id: ObjectId,
    name: String
};

const Exam = {
    id: ObjectId,
    categoryMap: Array,
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
    id: ObjectId,
    user: Object,
    attempt: ObjectId,
    task: Object,
    details: Object
};

module.exports = {Database, Group, User, Category, Exercise, Exam, Attempt, Result}