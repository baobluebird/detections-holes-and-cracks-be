const path = require('path');//module path
const express = require('express');//common js module

const configViewEngine = (app) => {
    //config view engine
    app.set('views', path.join('./src', 'views'));//set view folder
    app.set('view engine', 'ejs');//set view engine
    //config static folder
    app.use(express.static(path.join('./src', 'public')));

}

module.exports = configViewEngine;