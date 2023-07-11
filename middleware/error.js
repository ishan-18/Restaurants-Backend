const ErrorResponse = require('../utils/errorResponse')

const errorHandler = async (err,req,res,next) => {
    let error = {...err}

    error.message = err.message

    console.log(err);

    //Mongoose Bad Object ID 
    if(err.name === 'CastError'){
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404);
    }

    //Mongoose Duplicate Key
    if(err.code === 11000){
        const message = `Duplicate Field value entered`;
        error = new ErrorResponse(message, 400)
    }

    //Validation
    if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val => val.message);
        err = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        status: false,
        error: error.message || "Server Error"
    })

}

module.exports = errorHandler