const express = require("express");
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const userRoute = require("./routes/userRoutes");
const bodyParser = require("body-parser");
const adminRoute = require("./routes/adminRoutes");
const session = require('express-session');
const config = require('./config/config');
const nocache = require('nocache');
const flash = require('connect-flash');
const multer = require('multer');


dotenv.config();

mongoose.connect("mongodb://localhost:27017/watchAura")
    .then(() => {
        console.log("succesfully connected to mongoDB");
    }).catch(() => {
        console.error("Error Connecting to mongoDB");
    });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/admin-assets', express.static(path.join(__dirname, './public/admin-assets')));
app.use("/assets", express.static(path.join(__dirname, './public/assets')));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    rolling: false,
    saveUninitialized: true
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/', userRoute);
app.use('/admin', adminRoute);



const port = process.env.PORT
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});
