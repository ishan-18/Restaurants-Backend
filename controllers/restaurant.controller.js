const asyncHandler = require("../middleware/async");
const Cuisine = require("../models/Cuisine");
const Restaurant = require("../models/Restaurant");
const ErrorResponse = require("../utils/errorResponse");
const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const {client} = require('../server')

//Promisfy the get, set and del methods of Redis Client
const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const delAsync = promisify(client.del).bind(client);

// @desc    GET ALL Restaurants
// @route   GET /api/v1/restaurant
// @access  Public
exports.getRestaurants = asyncHandler(async (req,res,next) => {

    let query;

    console.log(req.params)

    const reqQuery = {...req.query} 

    const removeFields = ['select','sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);


    let queryStr = JSON.stringify(reqQuery);

    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
    query = Restaurant.find(JSON.parse(queryStr)).populate('user', 'name email').populate('cuisines')

    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields)
    }

    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    }else{
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit
    const total = await Restaurant.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const pagination = {};
    if(endIndex < total){
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if(startIndex > 0){
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    
    const restaurants = await client.getAsync('restaurants');
    
    if(restaurants){
        res.status(200).json({
            code: 200,
            status: true,
            message: "Displaying the List of Restaurants from Redis",
            count: JSON.parse(restaurants).length,
            pagination,
            data: JSON.parse(restaurants)
        });
    }else{
        const restaurants = await query;

        client.setexAsync('restaurants', 3600, JSON.stringify(restaurants));

        res.status(200).json({
            code: 200,
            status: true,
            message: "Displaying the List of Restaurants",
            count: restaurants.length,
            pagination,
            data: restaurants
        })
    }
    
})

// @desc    GET a Restaurant By ID
// @route   GET /api/v1/restaurant/:id
// @access  Public
exports.getRestaurant = asyncHandler(async (req,res,next) => {
    const restaurantId = req.params.id
    const redisKey = `restaurant${restaurantId}`;

    const restaurant = await client.getAsync(redisKey);

    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json')

    if(restaurant){
        res.status(200).json({
            code: 200,
            status: true,
            message: `Displaying the Details of Restaurant: ${JSON.parse(restaurant).name} Branch: ${JSON.parse(restaurant).branch} from Redis`,
            data: JSON.parse(restaurant)
        })
    }else{
        const restaurant = await Restaurant.findById(restaurantId)  
        
        setexAsync(redisKey, 3600, JSON.stringify(restaurant));

        if(restaurant){
            res.status(200).json({
                code: 200,
                status: true,
                message: `Displaying the Details of Restaurant: ${restaurant.name} Branch: ${restaurant.branch}`,
                data: restaurant
            })
        }else{
            return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 401));
        }
    }    
})

// @desc    POST A Restaurant
// @route   POST /api/v1/restaurant
// @access  Private
exports.createRestaurant = asyncHandler(async (req,res,next) => {
    const { name, branch } = req.body
    req.body.user = req.user.id;    

    if(req.user.role !== 'admin' ){
        return next(new ErrorResponse(`The user with this ID ${req.user.id} can't create a restaurant`, 400));
    }

    const existingRestaurant = await Restaurant.findOne({ name, branch });
    if (existingRestaurant) {
      return next(new ErrorResponse('Restaurant already exists with the same name and branch', 400));
    }

    const restaurant = await Restaurant.create(req.body);

    delAsync('restaurants');

    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
        code: 201,
        status: true,
        message: "Restaurant Created Successfully",
        data: restaurant
    })
})

// @desc    Update A Restaurant
// @route   PUT /api/v1/restaurant/:id
// @access  Private
exports.updateRestaurant = asyncHandler(async (req,res,next) => {
    const restaurantId = req.params.id;
    const redisKey = `restaurant${restaurantId}`;

    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
        return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 401));
    }

    if(restaurant.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 401))
    }

    await Restaurant.findByIdAndUpdate(restaurantId, req.body, {
        new: true,
        runValidators: true
    })

    delAsync(redisKey);

    res.setHeader('Allow', 'PUT');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        code: 200,
        status: true,
        message: "Restaurant Updated Successfully"
    })

})

// @desc    Delete A Restaurant
// @route   DELETE /api/v1/restaurant/:id
// @access  Private
exports.deleteRestaurant = asyncHandler(async (req,res,next) => {
    const restaurantId = req.params.id;
    const redisKey = `restaurant${restaurantId}`;

    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
        return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 401));
    }

    if(restaurant.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 401))
    }

    await Restaurant.findByIdAndDelete(restaurantId)

    delAsync(redisKey);

    res.setHeader('Allow', 'DELETE');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        code: 200,
        status: true,
        msg: "Restaurant Deleted Successfully"
    })
})

// @desc    Get All Cuisines of a Restaurant
// @route   GET /api/v1/restaurant/:id/cuisines
// @access  Private
exports.getRestaurantCuisines = asyncHandler(async (req,res,next) => {
    const restaurantId = req.params.id;

    // Find the restaurant by ID and populate the 'cuisines' field
    const restaurant = await Restaurant.findById(restaurantId).populate('cuisines');

    if (!restaurant) {
      return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 404))
    }

    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');

    // Extract the cuisines from the restaurant object

    const cuisines = await client.getAsync('cuisines');
    if(cuisines){
        res.status(200).json({ 
            code: 200,
            status: true,
            message: `Displaying all the cuisines of Restaurant: ${restaurant.name} from Redis`,
            data: JSON.parse(cuisines) 
        });
    }else{
        const cuisines = restaurant.cuisines;

        client.setexAsync('cuisines', 3600, JSON.stringify(cuisines));

        res.status(200).json({ 
            code: 200,
            status: true,
            message: `Displaying all the cuisines of Restaurant: ${restaurant.name}`,
            data: cuisines 
        });
    }

    
    
})

// @desc    Post a Cuisine under a Particular Restaurant
// @route   POST /api/v1/restaurant/:id/cuisines
// @access  Private
exports.postRestaurantCuisine = asyncHandler(async (req,res,next) => {
    const restaurantId = req.params.id;

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
        return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 401));
    }

    if(restaurant.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 401))
    }

    // Create a new cuisine
    const cuisine = await Cuisine.create(req.body)

    // Add the cuisine to the restaurant's cuisines array
    restaurant.cuisines.push(cuisine);
    await restaurant.save();

    delAsync('cuisines');

    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({ 
        code: 201,
        status: true,
        message: `Adding a Cuisine: ${cuisine.name} to Restaurant: ${restaurant.name}`,
        data: cuisine  
    });
})

// @desc    Update a Cuisine under a Particular Restaurant
// @route   PUT /api/v1/restaurant/:restaurantId/cuisines/:cuisineId
// @access  Private
exports.updateRestaurantCuisine = asyncHandler(async (req,res,next) => {
    const { restaurantId, cuisineId } = req.params;
    const { name, description, vegNonveg, pictures, ingredients, preparationTime, isPopular } = req.body;


    const restaurant = await Restaurant.findById(restaurantId).populate('cuisines');

    if(!restaurant){
        return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 401));
    }

    if(restaurant.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 401))
    }

    const cuisine = restaurant.cuisines.find(c => c._id === cuisineId);

    if (!cuisine) {
        return next(new ErrorResponse(`Cuisine not found with id of ${cuisine}`, 404));
    }

    // Update the cuisine fields
    cuisine.name = name;
    cuisine.description = description;
    cuisine.vegNonveg = vegNonveg;
    cuisine.pictures = pictures;
    cuisine.ingredients = ingredients;
    cuisine.preparationTime = preparationTime;
    cuisine.isPopular = isPopular;

    await cuisine.save();

    delAsync('cuisines');

    res.setHeader('Allow', 'PUT');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
        code: 200,
        status: true,
        message: `Updating a Cuisine: ${cuisine.name} to Restaurant: ${restaurant.name}`,
        data: cuisine  
    });
})

// @desc    DELETE a Cuisine under a Particular Restaurant
// @route   DELETE /api/v1/restaurant/:restaurantId/cuisines/:cuisineId
// @access  Private
exports.deleteRestaurantCuisine = asyncHandler(async (req,res,next) => {
    const { restaurantId, cuisineId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 404));
    }

    //Find the index of the cuisine within the restaurant's cuisines array
    const cuisine = restaurant.cuisines.find(c => c._id === cuisineId);

    if (cuisine === -1) {
        return next(new ErrorResponse(`Cuisine not found with id of ${cuisine}`, 404));
    }

    //Remove the cuisine from the array
    restaurant.cuisines.splice(cuisine, 1);
    await restaurant.save();

    delAsync('cuisines');

    res.setHeader('Allow', 'DELETE');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        code: 200,
        status: true,
        message: `Deleted a Cuisine`,
        data: {}  
    });
})

// @desc    Upload Photo for ngo
// @route   PUT /api/v1/ngo/:id/photo
// @access  Private
exports.restaurantPhotoUpload = asyncHandler(async (req,res,next) => {
    const restaurant = await Restaurant.findById(req.params.id)

    if(!restaurant){
        return next(new ErrorResponse(`Restaurant not found with id of ${req.params.id}`, 404));
    }

    if(restaurant.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this restaurant`, 401))
    }

    if(!req.files){
        return next(new ErrorResponse(`Please Upload a photo of restaurant`, 400));
    }

    console.log(req.files.file)

    const file = req.files.file

    //Check if image is photo already
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Please Upload an valid Image File`, 400));
    }

    //Check file size
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Please Upload an image size less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    //Create a custom file Name
    file.name = `photo_${restaurant._id}${path.parse(file.name).ext}`
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) throw err.message
    });

    await Restaurant.findByIdAndUpdate(req.params.id, {
        $push: {
            pictures: file.name
        }
    },{
        runValidators: true
    });

    delAsync('cuisines');

    res.setHeader('Allow', 'PUT');
    res.status(200).json({
        success: true,
        data: file.name
    })
});


