const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let student = new Schema({
    username : String,
    name : String,
    rollno : String,
    password : String,
    mobile : String
})


const studentSchema = mongoose.model('student' , student)
module.exports = { student: studentSchema}