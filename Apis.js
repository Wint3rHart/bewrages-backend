let express = require('express');
let mongoose = require("mongoose")
let app = express();
let upload = require('./Cloud');
let { bewrages_model, user_model, orders_model } = require('./Models');
let { ObjectId, ChangeStream } = require('mongodb');
let cors = require('cors');
let mw = require('./multer');
let bcrypt = require('bcrypt');
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
let router = express.router
let fs = require('fs');
let jwt = require('jsonwebtoken');
let { v4: uuidv4 } = require("uuid");
let {createClient}=require("redis")
const cookieParser = require('cookie-parser');
app.use(cookieParser())
;
const key = '125xyzabc'
const redis = createClient({
    username: 'default',
    password: 'VYuMKiEz46cPbGwZVN8rn5ieTP2asW7y',
    socket: {
        host: 'redis-15607.c1.us-central1-2.gce.redns.redis-cloud.com',
        port: 15607
    }
});

(async () => {
    if (!redis.isOpen) {
        try {
            await redis.connect()
            console.log("redis connect");
            
        }
        catch (err) {
            console.log(err);
        }
    }
})();

redis.on("error", (err) => {
    console.log("redis error", err);
});

const bg_fnx=async ()=>{ setInterval(async () => {
    let session=await mongoose.startSession();
  await  session.startTransaction();
    try {
        
        let set_info=await redis.sMembers("comment-set");
        console.log(set_info);
        set_info.forEach(async (x,i)=>{ let z=  await redis.lRange(`comment-list-${x}`,0,-1) ;  await z.forEach(async (y,j)=>{ let parsed=JSON.parse(y);
            console.log(x);
            //  console.log(await bewrages_model.findOne({_id:x},{name:1}))
            ;await bewrages_model.findByIdAndUpdate( x, { $push: { reviews: parsed } }
        )
        
        })   });
    await session.endSession();
    set_info.forEach(async (x)=>{await redis.del(`comment-list-${x}`);await redis.sRem("comment-set",x) });
    

    } catch (error) {
         await   session.abortTransaction();
    }

finally{await session.endSession();}
// console.log(infos);


},11111000);  }

bg_fnx();


const generate_Access = (x) => {
    ; let token = jwt.sign(x, key, { expiresIn: "5m" });
    //  console.log(token);
    ; return token
}

const generate_Refresh = (x) => {
    ; let token = jwt.sign(x, key, { expiresIn: "24h" }); 
    // console.log(token);
    ; return token
}

app.get('/select', async(req,res,next)=>{
    try{let get=await redis.get(`select`);
    if(get){console.log("sending from cache");
    
    return res.status(200).send(JSON.parse(get))}else{console.log("no cache found");
    ;return next()}  }catch(err){return res.status(400).send(err.message)} 
},async (req, res) => {
    console.log('got');
try{
    let get = await bewrages_model.aggregate([{ $match: {} }, { $group: { _id: "$type" } }, { $sort: { _id: -1 } }])
    await redis.set("select",JSON.stringify(get))
    // console.log(get);
    res.status(200).send(get);}

    catch(err){ console.log(err);res.status(400).json("Operation failed")
    }






})

app.get("/drinks",async(req,res,next)=>{
    
    try{let get=await redis.get(`drinks-${req.query.category}`);
if(get){console.log("sending from cache");

return res.status(200).send(JSON.parse(get))}else{console.log("no cache found");
;return next()}  }catch(err){return res.status(400).send(err.message)}  }, async (req, res) => {

    // console.log(req.query);
console.log("from db");
    try {
        let get = req.query.category == 'All' ?
            await bewrages_model.find({}) :
            await bewrages_model.find({ type: req.query.category }); console.log(get);

        await redis.set(`drinks-${req.query.category}`,JSON.stringify(get))
        res.status(200).send(get)
    } catch (err) {
        res.status(400).json(err)
    }


})


app.post("/post", mw.single('file'), async (req, res) => {

    console.log(req.body.folder, req.body.name, req.file);


    let upload2 = await upload(req.file.path, req.body.folder, req.body.name); let url = upload2
    console.log(upload2);

    let db_upload = await bewrages_model.updateOne({ name: req.body.name }, [{ $set: { image: url } }]); fs.unlinkSync(req.file.path)


})


app.get("/order/:id",async(req,res,next)=>{   
   try{ 
    let get=await redis.get(`order-${req.params.id}`);

    if(get){
       
console.log("sending from cache");res.status(200).send(JSON.parse(get))}
else{console.log("not in cache");next()
}

}catch(err){res.status(400).send(err.message);}
    }, async (req, res) => {
    // ; console.log(req.params.id);
console.log("order rec");

    ; try {
        let get = await bewrages_model.findOne({ _id: req.params.id });
        await redis.set(`order-${req.params.id}`,JSON.stringify(get));
        res.status(200).send(get); 
        

    } catch (error) {console.log(error.message);
    
        res.status(400).send({ msg: error.message })
    }
})

app.post('/register', mw.single('file'), async (req, res) => {
    // console.log("sending user", req.body.file,req.body);
    ; try { let get = new user_model({ name: req.body.name, email: req.body.email, password: req.body.password, profilePic: req.file.buffer.toString("base64"), role: req.body.role }); 
   let saving= await get.save();
    res.status(200).json('User Registered') } 
    catch (err) { res.status(400).send({ err: err.message }) }
})

app.post('/sign', async (req, res, next) => {
    try {
       

        let role = new RegExp(req.body.role, "i")
            ; let get = await user_model.findOne({ name: req.body.username, role: role },{profilePic:0}); 
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

        ; return res.status(400).send(err)
    }
}, async (req, res) => {

    let session = await mongoose.startSession();
    await session.startTransaction();

    try {
        let access = generate_Access({ name: req.user.name, email: req.user.email, id: req.user.id, role: req.user.role });
        let refresh = generate_Refresh({ name: req.user.name, email: req.user.email, id: req.user.id, role: req.user.role });
        console.log(access, refresh);
        ; await user_model.updateOne({ name: req.body.username, role: req.body.role }, [{ $set: { refresh_token: refresh } }]);
        res.cookie("Access", access, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 300000 });
        res.cookie("Refresh", refresh, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 86400000 });
        session.commitTransaction(); return res.status(200).send({ msg: "User Signed In", dets: req.user });

    } catch (err) {
        console.log('error');
        session.abortTransaction();
        return res.status(400).send(err.name);

    } finally { session.endSession(); }



})
app.get("/login", (req, res, next) => {
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


}, async (req, res) => {

    return res.status(200).send(req.user);


});


app.get("/reviews/:id",async(req,res,next)=>{
    try{
    let cache_get=await redis.get(`reviews-${req.params.id}`);
    if(cache_get){
   return res.status(200).send(JSON.parse(cache_get)) }else{next()} }catch(err){console.log("error in redis cache check at reviews api");return res.status(400).send(err.message)}
},async(req,res)=>{

    try{
        let converted=[];
        let redis_get2=await redis.lRange(`comment-list-${req.params.id}`,0,-1);
        // console.log(redis_get2,typeof(redis_get2));
        if(redis_get2.length>0)converted= redis_get2.map(x=>{return JSON.parse(x)})
      let get=await bewrages_model.findOne({_id:req.params.id},{rating:1,reviews:1,name:1,type:1}).sort({rating:1}).limit(5);
    console.log(converted);
// console.log(get);
const collective={details:{name:get.name,rating:get.rating,type:get.type},reviews:[...get.reviews,...converted]};
await redis.set(`reviews-${req.params.id}`,JSON.stringify(collective))


return res.status(200).send(collective);

}catch(err){
    console.log("error at reviews db check",err.message)
;return res.status(400).send(err.message);}


})

app.post("/publish", async (req, res) => {

    // console.log(req.body);

    // let session=await mongoose.startSession();
    // await session.startTransaction();
    try {
        let id = uuidv4();
        console.log(id);
        
        let order={customer_id:req.body.customer_id,bewrage_id:req.body.bewrage_id,flavour:req.body.flavour,quantity:req.body.quantity,delivery:req.body.delivery,order:req.body.order,requests:req.body.requests,size:req.body.size,order_id:id}
     
        let redis_hash=await redis.hSet("orders",id,JSON.stringify(order));
        console.log(req.body.customer_id,order);
        
        let user_list = await redis.rPush(req.body.customer_id, JSON.stringify(order));


        // let get_list = await redis.lRange("orders", 0, -1);
        let get_user_list = await redis.lRange(req.body.customer_id, 0, -1);

        // ; console.log(get_user_list);

        // let get = new orders_model(req.body);
        //  let save = await get.save({session:session});
        // let get2 = await user_model.updateOne({ _id: req.body.customer_id }, [{ $set: { orders: { $concatArrays: ["$orders", [save._id]] } } }],{session:session});
        // console.log(req.body);
        // console.log(redis.isOpen);
        // log
        res.status(200).send({ msg: "Order placed", order_id: id })

        // console.log(await redis.hGetAll("orders"));

        // ;await session.commitTransaction();res.status(200).send(save);
    } catch (err) {
        console.log("error", err);
        // ;await session.abortTransaction();
        res.status(400).send({ msg: err.message });
    }
    //   finally{ await session.endSession();}
})


app.get("/refresh", async (req, res, next) => {


    let token = req?.cookies?.Refresh;
    if (token) {
        
   
    // console.log(token);
    try {
        let verify = jwt.verify(token, key); 
        // console.log(verify);

        let get = await user_model.findOne({ name: verify.name, email: verify.email, role: verify.role }); 
        // console.log(get);

        if (!get) return res.status(400).send({ msg: "Login Again" });
        req.user = { name: get.name, email: get.name, role: get.role, id: get._id };

        next();

    } catch (error) {
        console.log(error);

        return res.status(400).send({ type: "Refresh", message: error });
    } }else{console.log("aaaaa");;return res.status(400).send({msg:"Login  Again"})}


}, async (req, res) => {
    console.log('recieved');
     let access = generate_Access(req.user); res.cookie("Access", access, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300000 })
    return res.status(200).send({ msg: "new Access token generated" });
});

app.get("/user/:id", async (req, res) => {
   
    // console.log(req.cookies);
    try {
        let get_redis_user = await redis.lRange(req.params.id, 0, -1); console.log(get_redis_user);
let parsed=get_redis_user.map(x=>JSON.parse(x));
        console.log(parsed);

        
let get_user=await  user_model.findOne({_id:req.params.id});


        res.status(200).send({user:get_user,orders:parsed});

    } catch (err) { console.log(err);
    ;res.status(400).send(err) }
})

app.delete("/cancel",async(req,res)=>{console.log("cancel req reciever",req.body);
try{
    let user_rem=await redis.lSet(req.body.customer_id,req.body.index,"_Deleted_");
    let part2=await redis.lRem(req.body.customer_id,1,"_Deleted_");
    await redis.hDel("orders",req.body.order_id);
    res.status(200).json("Done")}
    catch(err){console.log(err);
    ;res.status(400).json(err)}

})
app.post("/comment/:bewrage_id",async(req,res)=>{
    let gen_id=uuidv4();
  
   
    // let get=await bewrages_model.findOneAndUpdate({_id:bewrage_id},[{$set:{reviews:{$concatArrays:["$reviews",[req.body]]}}}]);
    try{
        let data={rating:req.body.rating,comment:req.body.comment,user:req.body.user,status:req.body.status,cmt_id:gen_id};
let comment_list=await redis.rPush(`comment-list-${req.params.bewrage_id}`,JSON.stringify(data));

let list_add=await redis.sAdd("comment-set",req.params.bewrage_id);
const del=await redis.del(`reviews-${req.params.bewrage_id}`);
console.log(del);
res.status(200).send({msg:"Success"})
}catch(err){console.log(err);res.status(400).send(err)}

})


app.listen(4800, () => {
    console.log('started');
})