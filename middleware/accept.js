const asyncHandler = require('../middleware/async')

exports.accept = asyncHandler(async (req,res,next)=>{
    req.headers.accept = 'application/json';
    next();
})