let {redis}=require("./Mongo_Connect")


const login_check=(req, res, next) => {
    console.log('rec');
    let token = req?.cookies?.Access;
    if (!token) {
        return res.status(400).json("access token not present")
    }
    else {
        try {
            let verify = jwt.verify(token, key);
            //  console.log(verify);

            req.user = verify; next();
        } catch (error) {

            if (error.name == "TokenExpiredError") return res.status(400).send({ msg: "access token expired" })
            else { return res.status(400).send({ msg: error }) }

        }



    };


};
const login_confirm=async (req, res) => {

    return res.status(200).send(req.user);


};

const refresh_check=async (req, res, next) => {


    let token = req?.cookies?.Refresh;
    if (token) {


        // console.log(token);
        try {
            let verify = jwt.verify(token, key);


            let get = await user_model.findOne({ name: verify.name, email: verify.email, role: verify.role });
            // console.log(get);

            if (!get) return res.status(400).send({ msg: "Login Again" });
            req.user = { name: get.name, email: get.name, role: get.role, id: get._id };

            next();

        } catch (error) {
            console.log(error);

            return res.status(400).send({ type: "Refresh", message: error });
        }
    } else { console.log("aaaaa");; return res.status(400).send({ msg: "Login  Again" }) }


};

const refresh_token= async (req, res) => {
    console.log('recieved');
    let access = generate_Access(req.user); res.cookie("Access", access, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300000 })
    return res.status(200).send({ msg: "new Access token generated" });
};

module.exports={login_check,login_confirm,refresh_check,refresh_token}