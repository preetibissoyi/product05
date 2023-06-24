const userModel = require("../models/userModel")
const { uploadFile } = require("../aws/aws")
const bcrypt = require("bcrypt")
const { isValidstring, isValidemail, isValidphone, isValidfile, isValidpassword, isEmpty, isValidStreet, isValidpin, validObjectId } = require("../util/validator")
const jwt = require("jsonwebtoken")


// <==========================================> CREATE USER <==========================================>//

const createUser = async (req, res) => {
    try {
        let data = req.body
        let files = req.files

        // ==> Validations 
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "All fields are manndatory" })
        let { fname, lname, email, phone, password, address } = data //Destructuring

        if (!isEmpty(fname)) return res.status(400).send({ status: false, message: "fname is mandatory" })
        if (!isValidstring(fname)) return res.status(400).send({ status: false, message: "Enter Valid fname" })

        if (!isEmpty(lname)) return res.status(400).send({ status: false, message: "lname is mandatory" })
        if (!isValidstring(lname)) return res.status(400).send({ status: false, message: "Enter Valid lname" })

        if (!isEmpty(email)) return res.status(400).send({ status: false, message: "email is mandatory" })
        if (!isValidemail(email)) return res.status(400).send({ status: false, message: "Enter Valid email" })

        if (!isEmpty(phone)) return res.status(400).send({ status: false, message: "phone is mandatory" })
        if (!isValidphone(phone)) return res.status(400).send({ status: false, message: "Enter Valid phone" })

        let alreadyExits = await userModel.findOne({ $or: [{ email }, { phone }] })
        if (alreadyExits) {
            if (alreadyExits.email == email) return res.status(400).send({ status: false, message: `This ${email} already registered` })
            else if (alreadyExits.phone == phone) return res.status(400).send({ status: false, message: `This ${phone} already registered` })
        }

        if (files.length === 0) return res.status(400).send({ status: false, message: "profileImage is mandatory" })
        if (!isValidfile(files[0].originalname)) return res.status(400).send({ status: false, message: "ProfileImage is Invalid." })

        if (!isEmpty(password)) return res.status(400).send({ status: false, message: "password is mandatory" })
        if (!isValidpassword(password)) return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" })

        if (!address) return res.status(400).send({ status: false, message: "Please enter address for shipping and billing purpose" })

        address = JSON.parse(address)                //parse a json string and convert it into js object
        let { shipping, billing } = address    

        if (!shipping) return res.status(400).send({ status: false, message: "shipping is mandatory" })
        if (shipping) {
            if (!isEmpty(shipping.street)) return res.status(400).send({ status: false, message: "Shipping street is required" })
            if (!isValidStreet(shipping.street)) return res.status(400).send({ status: false, message: "Enter Valid shipping street" })

            if (!isEmpty(shipping.city)) return res.status(400).send({ status: false, message: "Shipping city is required" })
            if (!isValidstring(shipping.city)) return res.status(400).send({ status: false, message: "Enter Valid shipping city" })

            if (!isEmpty(shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is required" })
            if (!isValidpin(shipping.pincode)) return res.status(400).send({ status: false, message: "Enter Valid shipping pincode" })
        }
        if (!billing) return res.status(400).send({ status: false, message: "billing is mandatory" })
        if (billing) {
            if (!isEmpty(billing.street)) return res.status(400).send({ status: false, message: "Shipping street is required" })
            if (!isValidStreet(billing.street)) return res.status(400).send({ status: false, message: "Enter Valid shipping street" })

            if (!isEmpty(billing.city)) return res.status(400).send({ status: false, message: "Shipping city is required" })
            if (!isValidstring(billing.city)) return res.status(400).send({ status: false, message: "Enter Valid shipping city" })

            if (!isEmpty(billing.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is required" })
            if (!isValidpin(billing.pincode)) return res.status(400).send({ status: false, message: "Enter Valid shipping pincode" })
        }
        data.address = address

        let profilePic = await uploadFile(files[0])
        data.profileImage = profilePic

        let hash = bcrypt.hashSync(password, 10)
        data.password = hash

        let saveUser = await userModel.create(data)
        return res.status(201).send({ status: true, message: "User created successfully", data: saveUser })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> LOGIN USER <==========================================>//

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please provide some detail" })

        if (!isEmpty(email)) return res.status(400).send({ status: false, message: "Please provide EmailId" })
        if (!isValidemail(email)) return res.status(400).send({ status: false, message: "Email is Invalid" })

        if (!isEmpty(password)) return res.status(400).send({ status: false, message: "Please provide Password" })
        if (!isValidpassword(password)) return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" })

        const user = await userModel.findOne({ email })
        if (!user) { return res.status(404).send({ status: false, message: "Please provide correct email" }) }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) { return res.status(401).send({ Status: false, message: "incorrect credential" }) }

        const token = jwt.sign({ user: user._id}, "Project5-Group12",{ expiresIn: "48h"} )

        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: user._id, token } })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> GET USER <==========================================>//

const getUser = async (req, res) => {
    try {
        let userId = req.params.userId

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User id" })

        let userData = await userModel.findOne({ _id: userId })
        if (!userData) return res.status(404).send({ status: false, message: "User not found" })

        return res.status(200).send({ status: true, message: "User profile details", data: userData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <==========================================> UPDATE USER <==========================================>//

const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId
        const data = req.body
        const file = req.files

        if(!isEmpty(userId)) return res.status(400).send({ status: false, message: "please provide user Id" })
        if (!validObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User id" })

        const userData = await userModel.findOne({ _id: userId })
        if (!userData) return res.status(404).send({ status: false, message: "User not found" })

        if (req.user !== userId) return res.status(403).send({ status: false, message: "user is not Authorised for this operation" })

        if (Object.keys(data).length == 0 && (!file || file.length == 0)) return res.status(400).send({ status: false, message: "Please Provide data for Update" })
        let { fname, lname, email, phone, password, address, profileImage } = data;

        if (fname || fname == "") {
            if (!isEmpty(fname)) return res.status(400).send({ status: false, message: "Please Provide first name" })
            if (!isValidstring(fname)) return res.status(400).send({ status: false, message: "Enter Valid fname" })
        }
        if (lname || lname == "") {
            if (!isEmpty(lname)) return res.status(400).send({ status: false, message: "Please Provide last name" })
            if (!isValidstring(lname)) return res.status(400).send({ status: false, message: "Enter Valid lname" })
        }
        if (email || email == "") {
            if (!isEmpty(email)) return res.status(400).send({ status: false, message: "Please Provide email adress" })
            if (!isValidemail(email)) return res.status(400).send({ status: false, message: "Enter Valid email" })

            const checkEmail = await userModel.findOne({ email })
            if (checkEmail) return res.status(400).send({ status: false, message: "email id already exist" })
        }
        if (phone || phone == "") {
            if (!isEmpty(phone)) return res.status(400).send({ status: false, message: "Please Provide phone number" })
            if (!isValidphone(phone)) return res.status(400).send({ status: false, message: "Enter Valid phone number" })

            const checkPhone = await userModel.findOne({ phone })
            if (checkPhone) return res.status(400).send({ status: false, message: "phone number already exist" })
        }
        if (password) {
            if (!password) return res.status(400).send({ status: false, message: "password is mandatory" })
            if (!isValidpassword(password)) return res.status(400).send({ status: false, message: "Password Should be (8-15) in length with one upperCase, special character and number" })

            const encrypt = bcrypt.hashSync(password, 10);
            data.password = encrypt;
        }
        if (address) {
            address = JSON.parse(address)
            let { shipping, billing } = address

            if (!shipping) return res.status(400).send({ status: false, message: "shipping is mandatory" })
            if (shipping) {
                if (!isEmpty(shipping.street)) return res.status(400).send({ status: false, message: "Shipping street is required" })
                if (!isValidStreet(shipping.street)) return res.status(400).send({ status: false, message: "Enter Valid shipping street" })

                if (!isEmpty(shipping.city)) return res.status(400).send({ status: false, message: "Shipping city is required" })
                if (!isValidstring(shipping.city)) return res.status(400).send({ status: false, message: "Enter Valid shipping city" })

                if (!isEmpty(shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is required" })
                if (!isValidpin(shipping.pincode)) return res.status(400).send({ status: false, message: "Enter Valid shipping pincode" })
            }
            if (!billing) return res.status(400).send({ status: false, message: "billing is mandatory" })
            if (billing) {
                if (!isEmpty(billing.street)) return res.status(400).send({ status: false, message: "Shipping street is required" })
                if (!isValidStreet(billing.street)) return res.status(400).send({ status: false, message: "Enter Valid shipping street" })

                if (!isEmpty(billing.city)) return res.status(400).send({ status: false, message: "Shipping city is required" })
                if (!isValidstring(billing.city)) return res.status(400).send({ status: false, message: "Enter Valid shipping city" })

                if (!isEmpty(billing.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is required" })
                if (!isValidpin(billing.pincode)) return res.status(400).send({ status: false, message: "Enter Valid shipping pincode" })

            }
            data.address = address
        }


        if (file.length !== 0 || profileImage == "") {
            if (file.length === 0) return res.status(400).send({ status: false, message: "profileImage is mandatory" })
            if (!isValidfile(file[0].originalname)) return res.status(400).send({ status: false, message: "ProfileImage is Invalid." })

            let profilepic = await uploadFile(file[0])
            data.profileImage = profilepic
        }

        let updateData = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true });
        res.status(200).send({ status: true, message: "User profile updated", data: updateData });
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUser, loginUser, getUser, updateUser }