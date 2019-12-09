const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let menu = new Schema({
    day: {
        Mon : Object,
        Tue : Object,
        Wed : Object,
        Thu : Object,
        Fri : Object,
        Sat : Object,
        Sun : Object,
    }
})


const menuSchema = mongoose.model('menu' , menu)
module.exports = { menu: menuSchema}