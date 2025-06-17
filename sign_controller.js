
let {redis}=require("./Mongo_Connect")

const key = '125xyzabc';
let bcrypt = require('bcrypt');
let { bewrages_model, user_model } = require('./Models');
let jwt = require('jsonwebtoken');
let mongoose=require("mongoose");

const generate_Access = (x) => {
    ; let token = jwt.sign(x, key, { expiresIn: "5m" });
    //  console.log(token);
    ; return token
};

const generate_Refresh = (x) => {
    ; let token = jwt.sign(x, key, { expiresIn: "24h" });
    // console.log(token);
    ; return token
};



const register=async (req, res) => {
    // console.log("sending user", req.body.file,req.body);
    ;
     try {
        let get = new user_model({ name: req.body.name, email: req.body.email, password: req.body.password, profilePic: req.file.buffer.toString("base64"), role: req.body.role });
        let saving = await get.save();
       return res.status(200).json('User Registered')
    }
    catch (err) {return res.status(400).send({ err: err.message }) }
};

const sign_check=async (req, res, next) => {
    try {


        let role = new RegExp(req.body.role, "i")
            ; let get = await user_model.findOne({ name: req.body.username, role: role }, { profilePic: 0 });
        console.log(req.body);





        if (!get) {
            return res.status(400).send({ msg: "User Not Found" });
        }

        if (get.email !== req.body.email) {
            return res.status(400).send({ msg: "Invalid Email Address" });
        }

        let compare = await bcrypt.compare(req.body.password, get.password);
        if (!compare) {
            return res.status(400).send({ msg: "Wrong Password" });
        }
        req.user = { name: get.name, email: get.email, id: get._id, pic: get.profilePic, role: get.role }

        next();



    } catch (err) {
        console.log(err);
next(new Error(err.message));
        ; return res.status(400).send({msg:err.message})
    }
};

const signIn= async (req, res) => {
console.log("lallala");

    let session = await mongoose.startSession();
    await session.startTransaction();

    try {
        let access = generate_Access({ name: req.user.name, email: req.user.email, id: req.user.id, role: req.user.role });
        let refresh = generate_Refresh({ name: req.user.name, email: req.user.email, id: req.user.id, role: req.user.role });
        console.log(access, refresh);
        ; await user_model.updateOne({ name: req.body.username, role: req.body.role }, [{ $set: { refresh_token: refresh } }]);
        res.cookie("Access", access, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 300000 });
        res.cookie("Refresh", refresh, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 86400000 });
        session.commitTransaction();
             return res.status(200).send({ msg: "User Signed In", dets: req.user });

    } catch (err) {
        console.log('error');
        session.abortTransaction();
        return res.status(400).send({msg:err.message});

    } finally {await session.endSession(); }



};

module.exports={register,sign_check,signIn,generate_Access,generate_Refresh};