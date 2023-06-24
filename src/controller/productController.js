const productModel = require("../models/productModel")
const { isValidNum, isValidTitleEnum, isValidTD, isValidPrice, isValidfile, validObjectId, isEmpty, isValidStyle } = require("../util/validator")
const { uploadFile } = require("../aws/aws")

// <==========================================> CREATE PRODUCT <==========================================>//

const createProduct = async (req, res) => {
    try {
        let data = req.body
        let file = req.files
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (Object.keys(data) == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })

        if (!isEmpty(title)) return res.status(400).send({ status: false, message: "Title is mandatory" });
        if (!isValidTD(title)) return res.status(400).send({ status: false, message: "Title should be in alphabets only" })

        let findtitle = await productModel.findOne({ title })
        if (findtitle) return res.status(400).send({ status: false, message: " this title already exists" })

        if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description is mandatory" });
        if (!isValidTD(description)) return res.status(400).send({ status: false, message: "description should be in alphabets only" })

        if (!isEmpty(price)) return res.status(400).send({ status: false, message: "Price is mandatory" })
        if (!isValidNum(price) && !isValidPrice(price)) return res.status(400).send({ status: false, message: "Price should be in Number" })

        if (!isEmpty(currencyId)) return res.status(400).send({ status: false, message: "currencyId is mandatory" })
        if (currencyId && currencyId != "INR") return res.status(400).send({ status: false, message: "Only 'INR' CurrencyId is allowed" })

        if (!isEmpty(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat is mandatory" })
        if (currencyFormat && currencyFormat != "₹") return res.status(400).send({ status: false, message: "Only '₹' Currency Symbol is allowed" })

        if (file.length === 0) return res.status(400).send({ status: false, message: "productImage is mandatory" })
        if (!isValidfile(file[0].originalname)) return res.status(400).send({ status: false, message: "productImage is Invalid." })

        if (availableSizes || availableSizes == "") {
            if (!isValidTitleEnum(availableSizes)) return res.status(400).send({ status: false, message: "availableSizes should be in S/XS/M/X/L/XXL/XL" })
        }
        if (isFreeShipping || isFreeShipping == "") {
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping" })
        }
        if (style || style == "") {
            if (!isEmpty(style)) return res.status(400).send({ status: false, message: "Stule is not valid" })
            if (!isValidStyle(style)) return res.status(400).send({ status: false, message: "Style is not in correct format" })
        }
        if (installments) {
            if (!isValidNum(installments)) return res.status(400).send({ status: false, message: "installments should be in Number" })
        }

        let productPic = await uploadFile(file[0])
        data.productImage = productPic

        let createdproduct = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: createdproduct })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> GET PRODUCT BY QUERY <==========================================>//


const getProductsByQuery = async (req, res) => {
    try {
        let Query = req.query
        let filter = { isDeleted: false }
        let { size, name, priceLessThan, priceGreaterThan, priceSort } = Query

        if (Object.keys(Query).length === 0) return res.status(400).send({ status: false, message: "Please give some parameters." })

        if (size) {
            size = size.trim().toUpperCase()
            if (!isValidTitleEnum(size)) return res.status(400).send({ status: false, message: "availableSizes should be in S/XS/M/X/L/XXL/XL" })
            filter['availableSizes'] = { $in: size }
        }

        if (name) {
            if (!isValidTD(name)) return res.status(400).send({ status: false, message: "Title should be in alphabets only" })
            filter['title'] = { $regex: name }
        }

        if (priceLessThan) {
            if (!isValidNum(priceLessThan)) return res.status(400).send({ status: false, message: "Price is not valid" })
            filter['price'] = { $lt: priceLessThan }
        }

        if (priceGreaterThan) {
            if (!isValidNum(priceGreaterThan)) return res.status(400).send({ status: false, message: "Not a valid Price" })
            filter['price'] = { $gt: priceGreaterThan }
        }

        if (priceSort) {
            if (!(priceSort == 1 || priceSort == -1)) return res.status(400).send({ status: false, message: "Price can be sorted with the value 1 or -1 only" })
        }

        let getProducts = await productModel.find(filter).sort({ price: priceSort })

        if (getProducts.length === 0) return res.status(404).send({ status: false, message: "no data found" })
        return res.status(200).send({ status: true, message: 'Success', data: getProducts })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> GET PRODUCT BY ID <==========================================>//


const getProductsById = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!isEmpty(productId)) return res.status(400).send({ status: false, message: "please provide product Id" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "This productId is not valid" })

        const checkProduct = await productModel.findById({ _id: productId })
        if (!checkProduct) return res.status(404).send({ status: false, message: "This product is not found" })

        if (checkProduct.isDeleted == true) return res.status(404).send({ status: false, message: "This product has been deleted" })

        let getProducts = await productModel.findOne({ _id: productId, isDeleted: false })
        return res.status(200).send({ status: true, message: "Success", data: getProducts })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}

// <==========================================> UPDATE PRODUCT BY ID <==========================================>//

const updateProductById = async (req, res) => {
    try {
        const productId = req.params.productId
        const data = req.body
        const file = req.files
        let { title, description, price, isFreeShipping, style, availableSizes, installments, productImage } = data

        if (!isEmpty(productId)) return res.status(400).send({ status: false, message: "please provide product Id" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide valid Product Id" })

        const productData = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productData) return res.status(404).send({ status: false, message: "Product not found" })

        if (Object.keys(data).length == 0 && (!file || file.length == 0)) return res.status(400).send({ status: false, message: "Please Provide data" })

        if (title || title == "") {
            if (!isEmpty(title)) return res.status(400).send({ status: false, message: "Title is mandatory" });
            if (!isValidTD(title)) return res.status(400).send({ status: false, message: "Title should be in alphabets only" })

            const titleExist = await productModel.findOne({ title })
            if (titleExist) return res.status(400).send({ status: false, message: "title already exist" })
        }
        if (description || description == "") {
            if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description is mandatory" });
            if (!isValidTD(description)) return res.status(400).send({ status: false, message: "description should be in alphabets only" })
        }
        if (price || price == "") {
            if (!isEmpty(price)) return res.status(400).send({ status: false, message: "Price is mandatory" })
            if (!isValidNum(price) && !isValidPrice(price)) return res.status(400).send({ status: false, message: "Price should be in valid Number" })
        }
        if (isFreeShipping || isFreeShipping == "") {
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping" })
        }
        if (style || style == "") {
            if (!isEmpty(style)) return res.status(400).send({ status: false, message: "Stule is not valid" })
            if (!isValidStyle(style)) return res.status(400).send({ status: false, message: "Style is not in correct format" })
        }
        if (availableSizes || availableSizes == "") {
            if (!isValidTitleEnum(availableSizes)) return res.status(400).send({ status: false, message: "availableSizes should be in S/XS/M/X/L/XXL/XL" })
        }
        if (installments || installments == "") {
            if (!isValidNum(installments)) return res.status(400).send({ status: false, message: "installments should be in Number" })
        }
        if (file.length !== 0 || productImage == "") {
            if (file.length === 0) return res.status(400).send({ status: false, message: "productImage is mandatory" })
            if (!isValidfile(file[0].originalname)) return res.status(400).send({ status: false, message: "productImage is Invalid." })

            let productPic = await uploadFile(file[0])
            data.productImage = productPic
        }

        let updateData = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true });
        res.status(200).send({ status: true, message: "Product profile updated", data: updateData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> DELETE PRODUCT BY ID <==========================================>//

const delProductById = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!isEmpty(productId)) return res.status(400).send({ status: false, message: "please provide product Id" })
        if (!validObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid ProductId " })

        let delProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false, },
            { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })

        if (!delProduct) return res.status(404).send({ status: false, message: "No product found by given ProductId" })

        return res.status(200).send({ status: true, message: "Product Deleted Succesfully" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}

module.exports = { createProduct, getProductsByQuery, getProductsById, updateProductById, delProductById }