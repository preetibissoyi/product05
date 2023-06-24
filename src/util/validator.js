const mongoose = require("mongoose")

// ==> Validation for string
const isValidstring = function (pass) {
    return (/^[A-Za-z]+$/).test(pass)
}

// ==> Validation for Email
const isValidemail = function (email) {
    return (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/).test(email);
}

// ==> Validation for phone
const isValidphone = function (phone) {
    return (/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/).test(phone);
}

// ==> Validation for file
const isValidfile = function (filename) {
    return (/^.*\.(jfif|png|jpg|JPG|gif|GIF|webp|tiff?|bmp)$/).test(filename)
};

// ==> Validation for password
const isValidpassword = function (pass) {
    return (/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&])[a-zA-Z0-9@#$%&]{8,15}$/).test(pass);
}

// ==> Validation for Empty or not
const isEmpty = function (value) {
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length == 0) return false;          
    return true;
};

const isValidStreet = function (street) {
    let streets = /^[#.0-9a-zA-Z\s,-]+$/;
    return streets.test(street);
};

// ==> Validation for Pincode
const isValidpin = function (pincode) {
    return (/^[1-9][0-9]{5}$/).test(pincode)

};

// ==> Validation for Object Id
const validObjectId = function (Id) {
    return mongoose.Types.ObjectId.isValid(Id)
}

// ==> Validation for Number
const isValidNum = function (price) {
    return (/^[0-9]*$/).test(price)
}

//==> Validation for availableSizes
const isValidTitleEnum = (title) => ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(title) !== -1;


//==> Validation for Title & Description
const isValidTD = function (y) {
    return (/^[a-zA-Z]+(([a-zA-Z ])?[a-zA-Z]*)*$/).test(y)
}

//==> Validation for  Description
const isValidDes = function (y) {
    return (/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/).test(y)
}

//==> Validation for Price
const isValidPrice = function(value) {
    return (/^[1-9]\d{0,8}(?:\.\d{1,2})?$/).test(value)
};

//==> Validation for Style
const isValidStyle = function (value) {
    return (/^[a-zA-Z _.-]+$/).test(value);
};

//==> Validation for removeProduct
const isValidRP = function (removeProduct) {
    return (/^[0-1]$/).test(removeProduct)
}




module.exports = { isValidstring, isValidemail, isValidphone, isValidfile, isValidpassword, isEmpty, isValidStreet, isValidpin, validObjectId, isValidNum, isValidTitleEnum, isValidTD, isValidPrice, isValidStyle, isValidRP, isValidDes }