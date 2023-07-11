const router = require('express').Router();
const { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurant, getRestaurantCuisines, postRestaurantCuisine, updateRestaurantCuisine, deleteRestaurantCuisine, restaurantPhotoUpload } = require('../controllers/restaurant.controller');
const { accept } = require('../middleware/accept');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(accept, getRestaurants).post(protect, authorize('admin'), accept, createRestaurant)
router.route('/:id').get(accept, getRestaurant).put(protect, authorize('admin'), accept, updateRestaurant).delete(protect, authorize('admin'), accept, deleteRestaurant)
router.route('/:id/cuisines').get(protect, authorize('customer'), accept, getRestaurantCuisines).post(protect, authorize('admin'), accept, postRestaurantCuisine)
router.route('/:restaurantId/cuisines/:cuisineId').put(protect, authorize('admin'), accept, updateRestaurantCuisine).delete(protect, authorize('admin'), accept, deleteRestaurantCuisine)
router.put('/:id/photo', protect, authorize('admin'), accept, restaurantPhotoUpload)

module.exports = router