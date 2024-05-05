const UserRouter = require('./UserRouter')

const adminUserRouter = require('./adminUserRouter')
const adminLoginRouter = require('./adminLoginRouter')
const routes = (app) => {
    app.use('/api/user', UserRouter)

    app.use('/admin/user', adminUserRouter)
    app.use('/admin/',adminLoginRouter)
}

module.exports = routes