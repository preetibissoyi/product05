const jwt = require("jsonwebtoken")



const authentication = async (req, res, next) => {
    try {
        let token = req.headers['authorization']
        if (!token) return res.status(400).send({ status: false, message: "Token must be present" })
        token = token.slice(7)  // bearer Token = Token 

        jwt.verify(token, "Project5-Group12", (err, resolve) => {
            if(err){
                if (err.name === "TokenExpiredError") return res.status(401).send({ status: false, message: "JWT is expired, Please login again"});
                if (err.name === "JsonWebTokenError") return res.status(401).send({status: false, message: "Invalid Token, Please login again"});   
        }
            req['user'] = resolve.user
            next()
        })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { authentication }

