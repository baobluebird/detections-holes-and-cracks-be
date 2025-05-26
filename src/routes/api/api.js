//src\routes\api\user.routes.js
const UserRouter = require('./user.routes')
const CodeRouter = require('./code.routes')
const HomeRouter = require('./home.routes')
const DetectionRouter = require('./detection.routes')
const routes = (app, upload) => {
    app.use('/api/user', UserRouter)
    app.use('/api/code', CodeRouter)
    app.use('/home', HomeRouter)
    app.use('/api/detection', DetectionRouter(upload))
}

module.exports = routes