var express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')
const fs = require('fs');

const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://vivekuser:vivekadmin@cluster0-mfrcr.mongodb.net/studentmentor2?retryWrites=true&w=majority`;

var app = express();

app.use(cors());

app.use(bodyParser.json());

var students = [];

var mentors = [];

var relList = {};

var unassignedStudentsList = [];

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port);

    setFromDb();
});


app.get('/', function (req, res) {
    //setFromDb();
    res.end("Server Running ...");
});

function setInDb() {
    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("testDb");

        var testObj = { key: "relList", value: JSON.stringify(relList) };

        dbObject.collection("mainProdColl").insertOne(testObj, function (err, resp) {
            if (err) throw err;

            //console.log("RelList inserted in prod collection 1");

            db.close();
        });

        var sObj = { key: "Students", value: students }

        setStudentInDB();

        setMentorInDB();

    });

}

function setStudentInDB() {
    const client = new MongoClient(uri);


    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("testDb");

        var sObj = { key: "Students", value: students };

        dbObject.collection("mainProdColl").insertOne(sObj, function (err, resp) {
            if (err) throw err;

            //console.log("Students inserted in mainProdColl");

            db.close();
        });

        var usObj = { key: "unassignedStudents", value: unassignedStudentsList };

        dbObject.collection("mainProdColl").insertOne(usObj, function (err, resp) {
            if (err) throw err;

            //console.log("Unassigned Students inserted in mainProdColl");

            db.close();
        });

    });
}



function setFromDb() {
    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("testDb");

        var testObj = { relList: JSON.stringify(relList) };

        dbObject.collection("mainProdColl").find({ key: "relList" }).toArray(function (err, resp) {
            if (err) throw err;

            if (resp[resp.length - 1] !== undefined) {
                console.log("RelList retrieved from server");
                console.log(resp[resp.length - 1].value);

                relList = JSON.parse(resp[resp.length - 1].value);
            }

            db.close();
        });

        dbObject.collection("mainProdColl").find({ key: "Students" }).toArray(function (err, resp) {
            if (err) throw err;

            console.log("Students retrieved from server");
            if (resp[resp.length - 1] !== undefined) {
                students = resp[resp.length - 1].value;
                console.log(students);
            }

            db.close();
        });


        dbObject.collection("mainProdColl").find({ key: "Mentors" }).toArray(function (err, resp) {
            if (err) throw err;

            console.log("Mentors retrieved from server");

            if (resp[resp.length - 1] !== undefined) {
                mentors = resp[resp.length - 1].value;
                console.log(mentors);
            }

            db.close();
        });

        dbObject.collection("mainProdColl").find({ key: "unassignedStudents" }).toArray(function (err, resp) {
            if (err) throw err;

            console.log("Unaasigned Student retrieved from server");

            if (resp[resp.length - 1] !== undefined) {
                unassignedStudentsList = resp[resp.length - 1].value;
                console.log(unassignedStudentsList);
            }

            db.close();
        });

    });
}

function setMentorInDB() {
    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("testDb");

        var sObj = { key: "Mentors", value: mentors };

        dbObject.collection("mainProdColl").insertOne(sObj, function (err, resp) {
            if (err) throw err;

            console.log("Mentor inserted in mainProdColl");

            db.close();
        });

    });
}


app.post('/addMentor', function (req, res) {
    let body = req.body;
    if (mentors.includes(body.name)) {
        res.status(400).end("Mentor already Exists");
    }
    else {
        mentors.push(body.name);
        setMentorInDB();
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
        //console.log(unassignedStudentsList)
        setStudentInDB();

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
    console.log("Binding " + body.studentName + " : " + body.mentorName);
    if (!mentors.includes(body.mentorName)) {
        res.status(404).end('Mentor Not found');
    }

    if (!students.includes(body.studentName)) {
        res.status(404).end('Student Not found');
    }

    if (relList[body.mentorName] === undefined) {
        relList[body.mentorName] = [];
    }
    else if (relList[body.mentorName].includes(body.studentName)) {
        res.status(400).end('Relation already present');
    }
    else {
        relList[body.mentorName].push(body.studentName);
        unassignedStudentsList.splice(unassignedStudentsList.indexOf(body.studentName), 1);

        setInDb();

        console.log(relList);


        res.end("Added Relation");
    }


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