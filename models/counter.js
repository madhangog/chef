const mongoose =require ("mongoose")
const schema = mongoose.Schema;

let counter = new schema({
    username : String,
    name : String
})

const counterSchema = mongoose.model('counter' , counter)
module.exports = { counter : counterSchema}