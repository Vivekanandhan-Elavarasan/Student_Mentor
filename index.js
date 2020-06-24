var express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')
const fs = require('fs');

var app = express();

app.use(cors());

app.use(bodyParser.json());

var students = [];

var mentors = [];

var relList = {};

var unassignedStudentsList = [];

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});


app.get('/', function (req, res) {
    res.end("Server Running ...");
});

app.post('/addMentor', function (req, res) {
    let body = req.body;
    if (mentors.includes(body.name)) {
        res.status(400).end("Mentor already Exists");
    }
    else {
        mentors.push(body.name);
        res.end("Added Mentor");
    }
});

app.post('/addStudent', function (req, res) {
    let body = req.body;

    if (students.includes(body.name)) {
        res.status(400).end("Student already Exists");
    }
    else {
        students.push(body.name);

        unassignedStudentsList.push(body.name);

        res.end("Added Student");
    }

});

app.post('/removeStudentRel', function (req, res) {
    let body = req.body;
    unassignedStudentsList.push(body.name);

    for (let key in relList) {
        if (relList[key].includes(body.name)) {
            relList[key].splice(relList[key].indexOf(body.name), 1);
            res.end("Removed Student from Mentor " + key);
        }
    }

});

app.post('/addRel', function (req, res) {
    let body = req.body;
    if (!mentors.includes(body.mentorName)) {
        res.status(404).send('Mentor Not found');
    }

    if (!students.includes(body.studentName)) {
        res.status(404).send('Student Not found');
    }

    if (relList[body.mentorName] === undefined) {
        relList[body.mentorName] = [];
    }
    else if (relList[body.mentorName].includes(body.studentName)) {
        res.status(400).send('Relation already present');
    }

    relList[body.mentorName].push(body.studentName);
    unassignedStudentsList.splice(unassignedStudentsList.indexOf(body.studentName), 1);
    res.end("Added Relation");
});

app.get('/studentList', function (req, res) {
    res.json(students).end();
});

app.get('/mentorList', function (req, res) {
    res.json(mentors).end();
});

app.get('/relList', function (req, res) {
    res.json(relList).end();
});

app.get('/unassignedStudentsList', function (req, res) {
    res.json(unassignedStudentsList).end();
});