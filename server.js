const express=require("express");
const path = require("path");
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const session = require('express-session');
const bodyParser = require("body-parser");
const cookieParser=require("cookie-parser");
const app = express();
const port = process.env.PORT||8000
const cors = require('cors');
const crypto = require('crypto');
let jwt = require('jsonwebtoken');
let middleware = require('./middleware');


app.options('*', cors());
app.use(cors({
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use('/',express.static(path.join(__dirname, 'views')))
app.use(cookieParser())
app.use(bodyParser.json());
app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: false,
    resave: false,
    cookie: {}
}));

//importing modules
const {student} = require('./models/newUser')
const {counter} = require('./models/counter')
const {menu} = require('./models/menu')

//database details
mongoose.connect("mongodb+srv://newuser:newuser@cluster0-narhd.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
// console.log(db.on)
// console.log(db.once)
db.once('open', function() {
  // we're connected!
  console.log("mongodb connected")
});


//Hashing function for password
function hash(input,salt){
  var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
  return["pbkdf2","10000",salt,hashed.toString('hex')].join('$');
}

//SignUP
app.post('/student', function(req,res){
  let newStudent = new student(req.body)
  console.log(req.body)
  let salt = crypto.randomBytes(128).toString('hex')
  console.log("coming inside student api")
  console.log(newStudent)
  let password = newStudent.password
  let hassedPassword = hash(password , salt)
  newStudent.password = hassedPassword
  newStudent.save()
    .then(newStudent => {
      res.json({'status': 'done'})
      console.log("creation req")
    })
    .catch(err =>{
      res.status(400).send(" Registration Failed")
    })
});
app.post('/createmenu', function(req,res){
  let newmenu = new menu(req.body)
  console.log(req.body)
  // let salt = crypto.randomBytes(128).toString('hex')
  console.log("coming inside student api")
  console.log(newmenu)
  // let password = newmenu.password
  newmenu.save()
    .then(newmenu => {
      res.json(newmenu)
      console.log("creation req")
    })
    .catch(err =>{
      res.status(400).send(" creation Failed")
    })
});
//login
app.post('/studentLogin', async function(req,res){
  let studentData = req.body
  console.log(studentData)
  let userstudent = await student.findOne({username : studentData.username},function(err, response){
    if(err) return console.log(err)
    if(response){
      let hashedPassword = response.password
      // console.log(response.password)
      let salt = hashedPassword.split('$')[2]
      // console.log("slat is this string  .......",salt)
      let EnteredPassword = hash(studentData.password, salt)
      console.log(EnteredPassword == hashedPassword)
      if(EnteredPassword == hashedPassword){
        let token = jwt.sign({username: studentData.username},
          'abcd',
          { expiresIn: '24h' // expires in 24 hours
          }
        );
        console.log(token)
        req.session.username = studentData.username
        res.json({'status':'done',
                  'token': token});
        console.log(req.session)
      }
      else{
        res.json({'status': 'Incorrect Password'})
      }
    }
    else{
      res.json({'status':'Please SIGN UP before login'})
    }
  }) 
})
app.post('/AdminLogin', async function(req,res){
  let AdminData = req.body
  console.log(AdminData)
  // let userstudent = await student.findOne({username : studentData.username},function(err, response){
  //   if(err) return console.log(err)
  //   if(response){
  //     let hashedPassword = response.password
  //     // console.log(response.password)
  //     let salt = hashedPassword.split('$')[2]
  //     // console.log("slat is this string  .......",salt)
  //     let EnteredPassword = hash(studentData.password, salt)
  //     console.log(EnteredPassword == hashedPassword)
  //     if(EnteredPassword == hashedPassword){
  //       let token = jwt.sign({username: studentData.username},
  //         'abcd',
  //         { expiresIn: '24h' // expires in 24 hours
  //         }
  //       );
  //       console.log(token)
  //       req.session.username = studentData.username
  //       res.json({'status':'done',
  //                 'token': token});
  //       console.log(req.session)
  //     }
  //     else{
  //       res.json({'status': 'Incorrect Password'})
  //     }
  //   }
  //   else{
  //     res.json({'status':'Please SIGN UP before login'})
  //   }
  // }) 
  if(AdminData.adminId === 'iamadmin'){
    if(AdminData.password === 'mypassword'){
      res.json({'status': 'done'})
    }else{
      res.json({'status': 'incorrect password'})
    }
  }
})

//order making
app.get('/order', middleware.checkToken, async  function(req, res){
  let username = req.session.username
  let counters = await counter.findOne({username: username}, function(err,counted){
    if(err) return console.log(err)
    if(counted){
      res.json({'status':'exists'})
    }
    else{
      let studentData = student.findOne({username:username},function(err, studentAssests){
        if(err) return (err)
        if(studentAssests){
          console.log("this is assets ......",studentAssests)
          let newCounter = new counter({username:username, name: studentAssests.name})
        newCounter.save()
        .then(newCounter => {
            res.json({'status' : 'taken'})
        })
        .catch(err =>{
          res.status(400).send("count not take try again")
        })
        }
      })
      
    }
  })
})

app.get('/todayMenu', async function(req, res){
  // let dayfromuser = req.body.day
  // console.log(dayfromuser)
  let menus = await menu.find({}, async function (err, menu){
    if(err) return err
    if(menu){
      res.json(menu[0].day)
      console.log(menu[0].day)
    }else {
      console.log("nothid")
    }
  })
})
app.get('/totalCount', async function(req, res){
  // let dayfromuser = req.body.day
  // console.log(dayfromuser)
  let counters = await counter.find({}, async function (err, counter){
    if(err) return err
    if(counter){
      res.json(counter)
      console.log(counter)
    }else {
      console.log("nothing")
    }
  })
})

app.get('/checkorder', middleware.checkToken, async function(req, res){
  let username =  req.session.username;
  // console.log(username)
  let counterchecker = await counter.findOne({username: username}, async function(err, response){
    if(err) return (err)
    if(response){
      res.json({'status': 'ordered'})
    }
    else return res.json({'status':''})
  })
})

//decount
app.get('/decount', async function(req, res){
  let rollno = req.body.rollno
  let students = await student.findOne({rollno:rollno}, async function(err, user){
    if(err) return console.log(err)
    if(user){
      let username = students.username
      let counters = await counter.remove({username:username}, function(err, counterss){
        if(err) return console.log(err)
        if(counterss){
          //unknownss 
        }
        else{
          //unkowns
        }
      })
    }
    else{
      res.json({'status':'not_ordered'})
    }
  })
})

//clear counter
app.get('/clearCounter', async function(req, res){
  let counters = await counter.deleteMany({}, function(err, results){
    if(err) return console.log(err)
    if(results){
      //unknown field have to check
      console.log(results)
      res.json({'status': 'done'})
    }else{
      //unknown too
      res.json({'status': 'fail'})
    }
  })
})

//students have ordered and not eaten list
app.get('/notEaten', async function(req, res){
  let counters = await counter.find({}, function(err, results){
    if(err) return console.log(err)
    if(results){
      res.send(counters)
    }else{
      res.json({'status':'all_eaten'})
    }
  })
})

//logout
app.get('/logout',function(req,res){
  req.session.username=""
  req.session.cookie.expires=true
  res.redirect('/')
})

//port details
app.listen(port,function(){
  console.log("Server is listening at port "+port)
})