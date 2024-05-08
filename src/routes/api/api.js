//src\routes\api\user.routes.js
const UserRouter = require('./user.routes')
const DetectionRouter = require('./detection.routes')
const routes = (app) => {
    app.use('/api/user', UserRouter)
    app.use('/api/detection', DetectionRouter)
}

module.exports = routes