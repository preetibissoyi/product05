const express = require('express')
const router = express.Router()
const { createUser, loginUser, getUser, updateUser } = require("../controller/userController")
const { createProduct, getProductsByQuery, getProductsById, updateProductById, delProductById } = require("../controller/productController")
const { createCart, updatCart, getCart, deleteCart } = require("../controller/cartController")
const { creatOrder, updateOrder } = require("../controller/orderController")
const { authentication } = require("../middleware/auth")

// User API's
router.post("/register", createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUser)
router.put("/user/:userId/profile", authentication, updateUser)

// Product API's
router.post("/products", createProduct)
router.get("/products", getProductsByQuery)
router.get("/products/:productId", getProductsById)
router.put("/products/:productId", updateProductById)
router.delete("/products/:productId", delProductById)

// Cart API's
router.post("/users/:userId/cart",authentication, createCart)
router.put("/users/:userId/cart",authentication, updatCart)
router.get("/users/:userId/cart",authentication, getCart)
router.delete("/users/:userId/cart",authentication, deleteCart)

// Order API's
router.post("/users/:userId/orders", authentication, creatOrder)
router.put("/users/:userId/orders", authentication, updateOrder)


router.all('/*', function (req, res) {
  res.status(400).send({ status: false, message: "Invalid request" });
})


module.exports = router;  