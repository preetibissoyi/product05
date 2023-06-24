const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/cartModel")
const { validObjectId, isEmpty, isValidRP } = require("../util/validator")

const creatOrder = async (req, res) => {
    try {
        let data = req.body
        let { cartId, cancellable } = data
       let userId = req.params.userId

       if (Object.keys(data) == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })

       if (!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
       if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId Id" })

       if (req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

       let findUser = await userModel.findOne({ userId })
       if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

       if (!isEmpty(cartId)) return res.status(400).send({ status: false, message: "please provide cartId" })
       if (!validObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })

        const findCart = await cartModel.findOne({ _id: cartId })
        if (!findCart) return res.status(404).send({ status: false, message: "cart not found" })

       if (req.user !== findCart.userId.toString()) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })
        if (findCart.items.length == 0) return res.status(400).send({ status: false, message: "cart is empty, please add product to proceed your order" })

        if (cancellable) {
            if (cancellable !== true && cancellable !== false)
              return res.status(400).send({ status: false, Message: "Cancellable Value must be boolean" })
           data.cancellable = cancellable
        }

        let { items, totalPrice, totalItems } = findCart

        let totalQuantity = 0
       for (let i = 0; i < items.length; i++) {
            totalQuantity += Number(items[i].quantity)
        }

        let obj = { userId, items, totalPrice, totalItems, totalQuantity, cancellable }

        let order = await orderModel.create(obj)
       await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { items: [], totalItems: 0, totalPrice: 0 })

        return res.status(201).send({ status: true, message: 'Success', data: order });
    }
   catch (err) {
       return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> UPDATE ORDER <==========================================>//


const updateOrder = async (req, res) => {
   try {
       let data = req.body
       let { orderId, status } = data
       let userId = req.params.userId

       if (Object.keys(data) == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })

       if (!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
       if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid user Id" })

       if (req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

       let findUser = await userModel.findOne({ userId })
       if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

       if (!isEmpty(orderId)) return res.status(400).send({ status: false, message: "OrderId is required" })
       if (!validObjectId(orderId)) return res.status(400).send({ status: false, message: "Invalid order Id" })

       if (!isEmpty(status)) return res.status(400).send({ status: false, message: "Status is required" })
       if (!["completed", "cancelled"].includes(status)) return res.status(400).send({ status: false, message: "Status should only Completed or cancelled" })

       const checkOrderStatus = await orderModel.findById(orderId)

       if (status) {
           if (checkOrderStatus.status == "completed" && [status == "cancelled" || status == "completed"])
               return res.status(400).send({ status: false, message: "Order is already completed" })

           if (checkOrderStatus.status == "cancelled" && [status == "cancelled" || status == "completed"])
               return res.status(400).send({ status: false, message: "Order is already cancelled " })

           if (checkOrderStatus.cancellable == false && status == "cancelled")
               return res.status(400).send({ status: false, message: "Sorry ! This Order is not Cancellable " })
       }

       const update = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status } }, { new: true })
       if (!update) { return res.status(404).send({ status: false, message: "Order not found With given OrderId" }) }

       return res.status(200).send({ status: true, message: "Status Updated Succesfully", data: update })
   }
   catch (err) {
       return res.status(500).send({ status: false, message: err.message })
   }
}

//=============================================//
const creatorder = async function (req, res) {
    try {
      let data = req.body;
      let { cartId, cancellable } = data;
      let userId = req.params.userId;
  
      if (cartId) {
        // Code for handling cartId
      }
      if (cancellable) {
        // Code for handling cancellable
      }
  
      let { items, totalprice, totalitems } = findcart;
  
      let totalQuantity = 0;
      for (let i = 0; i < items.length; i++) {
        // Code inside the loop
      }
  
    } catch (error) {
      return res.status(500).send({ status: false, msg: error.msg });
    }
  };
  
  module.exports = { creatorder, updateOrder };
  