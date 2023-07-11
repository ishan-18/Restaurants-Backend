const express = require('express')
const dotenv = require('dotenv');
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xssClean = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const compression = require('compression')
const colors = require('colors')
const connectDB = require('./config/db')
const treblle = require('@treblle/express');
const { accept } = require('./middleware/accept');
const errorHandler = require('./middleware/error');
const path = require('path');
const redis = require('redis-promisify')

dotenv.config({path: './config/config.env.env'})

//DB Connected
connectDB()

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
    treblle({
        apiKey: process.env.TREBLLE_API_KEY,
        projectId: process.env.TREBLLE_PROJECT_ID,
        additionalFieldsToMask: [],
        showErrors: true
    })
)

//Redis Connection
exports.client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

//Enable CORS
app.use(cors())
app.options('*', cors())

//For file Uploading
app.use(fileUpload())

/*
Sanitizing Data
For eg: {"gt": ""} 
*/
app.use(mongoSanitize())

//Adding additional headers for security purposes
app.use(helmet())

/*
To Prevent Cross Site Scripting
For eg: <script></script>
*/
app.use(xssClean())

//For Limitting the number of amount of Requests
const limitter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50
})
app.use(limitter)

//To Prevent HTTP Param Pollution
app.use(hpp())

//Middleware to set X-Frame-Options header
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'deny');
    next();
});



//Gzip Compression
// app.use(compression({
//     level: 6,

// }))

if(process.env.NODE_ENV === 'development'){
    app.use(morgan(
        'dev'
    ))
}

//Static upload 
app.use(express.static(path.join(__dirname, 'public')))

//Routes Endpoints
app.use('/api/v1/user', require('./routes/user.route'))
app.use('/api/v1/restaurant', require('./routes/restaurant.route'))


//Error Handler
app.use(errorHandler)

//Sending 404 Error For Unknown Requests
app.all('*', (req,res,next) => {
    return res.status(404).json({
        status: false,
        message: "Error 404: Not Found"
    })
})

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server listening in ${process.env.NODE_ENV} on port @${PORT} 🚀`.yellow.bold)
})

process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`.red.bold);
    server.close(() => process.exit(1))
})