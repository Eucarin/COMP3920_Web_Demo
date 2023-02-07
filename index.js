require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;
const app = express();
const expire = 1000 * 60 * 60;

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

var users = []; 
var exists = 1;

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.btljyh8.mongodb.net/?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret
	}
})
app.use(express.urlencoded({extended: false}));

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.get('/', (req,res) => {
    if(!req.session.authenticated) {
        var html = `
        <form action='/signup' method='get'>
        <button style="display: block" name="signup">Sign up</button>
        </form>
        <form action='/login' method='get'>
        <button style="display: block" name="login">Log in</button>
        </form>
        `;
    
        res.send(html);
    }

});

app.post('/', (req,res) => {
    req.session.destroy();
    res.redirect('/');
})

app.get('/signup', (req,res) => {
    var html = `
    create user
    <form action='/signup' method='post'>
    <input style="display: block" name='name' type='text' placeholder='name' required>
    <input style="display: block" name='email' type='text' placeholder='email' required>
    <input style="display: block" name='password' type='password' placeholder='password' required>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.post('/signup', (req,res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({ name: name, email: email, password: hashedPassword });

    console.log(users);

    res.redirect('/members');
});

app.get('/members', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        var img = ["0.png", "1.png", "2.png"];
        var num = img[Math.floor(Math.random()*3)];

        var html = `
        Hello, ` + req.session.name + `.
        <img src='/public/${num}' style='display: block'>
        <form action='/' method='post'>
        <button style="display: block" name='close'>Sign out</button>
        </form>
        `;

        res.send(html);
    }
});

app.get('/login', (req,res) => {
    var html = `
    log in
    <form action='/login' method='post'>
    <input style="display: block" name='email' type='text' placeholder='email'>
    <input style="display: block" name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;

    if(exists == 0) {
        var html = `
        log in
        <form action='/login' method='post'>
        <input style="display: block" name='email' type='text' placeholder='email'>
        <input style="display: block" name='password' type='password' placeholder='password'>
        <button>Submit</button>
        </form>
        User and password not found.
        `;
        exists = 1;
    }

    res.send(html);
});

app.post('/login', (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.name = users[i].name;
                req.session.cookie.maxAge = expire;
        
                res.redirect('/members');
                return;
            }
        }
    }

    //user and password combination not found
    exists = 0;
    res.redirect('/login');
    
});

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})

app.use("/public", express.static("./public"));

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 