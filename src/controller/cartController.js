const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const { validObjectId, isEmpty, isValidRP } = require("../util/validator")
const { use } = require("../routes/route")

// <==========================================> CREATE CART <==========================================>//

const createCart = async (req, res) => {
    try {
        let data = req.body
        let { productId, cartId, quantity } = data
        let userId = req.params.userId;

        if (Object.keys(data) == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId Id" })

        if (req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

        const checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (!isEmpty(productId)) return res.status(400).send({ status: false, message: "productId required" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product Id" })

        const productExist = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productExist) return res.status(404).send({ status: false, message: "Product not found" })

        quantity = quantity || 1
        if (isNaN(quantity)) return res.status(400).send({ status: false, message: "quntity should be number" })

        if (cartId || cartId == "") {
            if (!isEmpty(cartId)) return res.status(400).send({ status: false, message: "please provide cartId" })
            if (!validObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })
            
            const cart = await cartModel.findOne({ _id: cartId })
            if (!cart) return res.status(404).send({ status: false, message: "cart not found" })
        }

        const cartExist = await cartModel.findOne({ userId })

        if (cartExist) {
            if (!isEmpty(cartId)) return res.status(400).send({ status: false, message: "This user has already cart Id so please provide cartId" })
            if (cartExist._id.toString() !== cartId) return res.status(403).send({ status: false, message: "Cart does not belong to this user, user is not Authorised for this operation " })

            // ==> That product which is already in the cart 🛒 
            for (let i = 0; i < (cartExist.items).length; i++) {
                if (cartExist.items[i].productId == productId) {
                    cartExist.items[i].quantity = Math.round(Number(cartExist.items[i].quantity) + Number(quantity))
                    cartExist.totalPrice = Math.round(cartExist.totalPrice + ((quantity) * (productExist.price)))

                    const cartUpdate = await cartModel.findOneAndUpdate({ _id: cartId }, cartExist, { new: true }).select({'items._id':0})
                    return res.status(201).send({ status: true, message: "Success", data: cartUpdate })
                }
            }                                                                          
            // ==> Added new product in cart 🛒
            cartExist.items.push({ productId: productId, quantity: Math.round(quantity) })
            cartExist.totalItems = cartExist.totalItems + 1
            cartExist.totalPrice = Math.round(cartExist.totalPrice + ((quantity) * (productExist.price)))

            const newProduct = await cartModel.findOneAndUpdate({ _id: cartId }, cartExist, { new: true }).select({'items._id':0})
            return res.status(201).send({ status: true, message: "Success", data: newProduct })
        }
        // ==> For creating new cart 🛒
        let totalPrice = Math.round(quantity * productExist.price)
        let obj = {
            userId,
            items: [{ productId, quantity }],
            totalPrice,
            totalItems: 1
        }
        const newCart = await cartModel.create(obj)
        const createNewCart = await cartModel.findOne({userId}).select({'items._id':0})
        return res.status(201).send({ status: true, message: "Success", data: createNewCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> UPDATE CART <==========================================>//

const updatCart = async (req, res) => {
    try {
        let data = req.body
        let { productId, cartId, removeProduct } = data
        let userId = req.params.userId

        if (Object.keys(data) == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid user Id" })

        if (req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

        const checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (!isEmpty(productId)) return res.status(400).send({ status: false, message: "productId required" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product Id" })

        const productExist = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productExist) return res.status(404).send({ status: false, message: "Product not found" })

        if (productExist.isDeleted == true) return res.status(404).send({ status: false, message: `This ProductId : ${productId} is already deleted` })

        if (!isEmpty(cartId)) return res.status(400).send({ status: false, message: "please provide cartId" })
        if (!validObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })

        const cartExist = await cartModel.findOne({ _id: cartId })
        if (!cartExist) return res.status(404).send({ status: false, message: "cart not found" })
        if (req.user !== cartExist.userId.toString()) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })
        if (cartExist.items.length == 0) return res.status(404).send({ status: false, message: `You have not added any product in this Cart : ${cartId}` })

        if (!isEmpty(removeProduct)) return res.status(400).send({ status: false, message: "please provide removedProduct" })
        if (!isValidRP(removeProduct)) return res.status(400).send({ status: false, message: `RemoveProduct will be accepted only 0 or 1` })

        let items = cartExist.items

        for (let i = 0; i < items.length; i++) {                                 
            if (items[i].productId == productId) {
                let updatePrice = items[i].quantity * productExist.price               

                if (removeProduct == 0) {
                    let productRemoved = await cartModel.findOneAndUpdate({ _id: cartId },
                        {
                            $pull: { items: { productId } },
                            totalPrice: (cartExist.totalPrice - updatePrice).toFixed(), totalItems: cartExist.totalItems - 1
                        }, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: productRemoved })
                }
                if (removeProduct == 1) {
                    if (items[i].quantity == 1 && removeProduct == 1) {
                        let allRemovedProduct = await cartModel.findOneAndUpdate({ _id: cartId },
                            {
                                $pull: { items: { productId } },
                                totalPrice: (cartExist.totalPrice - updatePrice).toFixed(), totalItems: cartExist.totalItems - 1
                            }, { new: true })
                        return res.status(200).send({ status: true, message: "Success", data: allRemovedProduct })
                    }
                    else {
                        items[i].quantity = items[i].quantity - 1
                        let cartUpdate = await cartModel.findByIdAndUpdate({ _id: cartId },
                            { items, totalPrice: (cartExist.totalPrice - productExist.price.toFixed()) }, { new: true })
                        return res.status(200).send({ status: true, message: "Succes", data: cartUpdate })
                    }
                }
            }
            else {
                return res.status(400).send({ status: false, message: "this product is not available in cart" })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> GET CART <==========================================>//

const getCart = async (req,res) => {
    try{
        let userId = req.params.userId

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid user Id" })

        if(req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

        const checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser) return res.status(404).send({ status: false, message: "User does not exists" })

        const findCart = await cartModel.findOne({ userId })
        if (!findCart) return res.status(404).send({ status: false, message: "cart not found" })

        return res.status(200).send({ status: true, message: "Success", data: findCart })
    }
    catch(err){
        return res.status(500).send({status: false, message: err.message})
    }
}

// <==========================================> DELETE CART <==========================================>//

const deleteCart = async (req,res) => {
    try{
        let userId = req.params.userId

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid user Id" })

        if(req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

        const checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser) return res.status(404).send({ status: false, message: "User does not exists" })

        const checkCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } })

        if (checkCart.totalItems == 0) return res.status(400).send({ status: false, message: "Cart is already empty" })
        if (!checkCart) return res.status(404).send({ status: true, message: 'Cart Not Found' })

        return res.status(204).send({ status: true, message: "Cart Deleted successfully" })
    }
    catch(err){
        return res.status(500).send({status: false, message: err.message})
    }
}



module.exports = { createCart, updatCart, getCart, deleteCart }