const { user_model } = require("./Models");
let {redis}=require("./Mongo_Connect")
let jwt=require('jsonwebtoken');
const { generate_Access, generate_Refresh } = require("./sign_controller");
const key = '125xyzabc'
const login_check=(req, res, next) => {
    console.log('rec in login check');
    let token = req?.cookies?.Access;
    if (!token) {console.log("access token not present");
    
        return res.status(400).json("access token not present")
    }
    else {
        try {console.log(req.cookies);
            let verify = jwt.verify(token, key);
             

            req.user = verify; next();
        } catch (error) {
next(new Error (error.message))
            if (error.name == "TokenExpiredError")
                 return res.status(400).send({ msg: "access token expired" })
            else { return res.status(400).send({ msg: error }) }
            next(new Error(er))

        }



    };


};
const login_confirm=async (req, res) => {
console.log("logging");

    return res.status(200).send(req.user);


};

const refresh_check=async (req, res, next) => {


    let token = req?.cookies?.Refresh;
    if (token) {


        
        try {console.log(token);
            let verify = jwt.verify(token, key);


            let get = await user_model.findOne({ name: verify.name, email: verify.email, role: verify.role });
            // console.log(get);
if(token!==get.refresh_token){
    next(new Error("Invalid refresh token or theft attempt-Login Again"));
    
};
            if (!get) return res.status(400).send({ msg: "Login Again" });
            req.user = { name: get.name, email: get.email, role: get.role, id: get._id };

            next();

        } catch (error) {
            console.log(error.message);
next(new Error(error.message))
            return res.status(400).send({ type: "Refresh", message: error });
        }
    } else {  return res.status(400).send({ msg: "Login  Again" }) }


};

const refresh_token= async (req, res) => {
    console.log('recieved');
  try{  let access = generate_Access(req.user); 
    let refresh=generate_Refresh(req.user);
    await user_model.updateOne({_id:req.user.id},{$set:{"refresh_token":refresh}});
    res.cookie("Access", access, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300000 });
    res.cookie("Refresh",refresh,{httpOnly:true,sameSite:"strict",secure:true,maxAge:86400000})
    return res.status(200).send({ msg: "new Access token generated" })}
    catch(err){
      return  res.status(400).send({msg:err.message})
    }
};

module.exports={login_check,login_confirm,refresh_check,refresh_token}