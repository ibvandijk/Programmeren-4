require('dotenv').config()

const loglevel = (module.exports = {
    jwtSecretKey: process.env.JWT_SECRET
})