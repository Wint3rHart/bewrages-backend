let express = require('express');
let mongoose = require("mongoose")
let app = express();
let upload = require('./Cloud');
let cors = require('cors');
let mw = require('./multer');
let fs = require('fs');
let {redis}=require("./Mongo_Connect");
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
const cookieParser = require('cookie-parser');
let router = express.Router();
app.use(cookieParser());
let { bewrages_model, user_model } = require('./Models');
let {get_drinks_cache,get_drinks_db,search_cache,search_db,select_cache,select_db,user_stuff}=require("./controllers");
let {register,sign_check,signIn}=require("./sign_controller");
let {login_check,login_confirm,refresh_check,refresh_token}=require("./tokens_controller");
let {reviews,comment_post}=require("./reviews_controller");
const { order_cancel, order_publish, order_cache, order_db } = require('./orders_controller');


// redis.flushAll().then(x=> console.log("all flushed"))


const bg_fnx = async () => {
    setInterval(async () => {
        let session = await mongoose.startSession();
      
        try {
  await session.startTransaction();
            let set_info = await redis.sMembers("comment-set");
            if (set_info && set_info.length > 0) {
                console.log(set_info);
                for(const id of set_info){
                    let a=await redis.lRange(`comment-list-${id}`,0,-1);
                    for(const comment of a){let parsed=JSON.parse(comment); await bewrages_model.findByIdAndUpdate(id,{$push:{reviews:parsed}},{session}) }
                };
                await session.commitTransaction();
               
                for(const del of set_info){await redis.del(`comment-list-${del}`); await redis.sRem("comment-set", del) }
                

            }



        } catch (error) {
            await session.abortTransaction();
        }

        finally { await session.endSession(); }
        // console.log(infos);


    }, 180000);
}

bg_fnx();

// const bg_fnx = async () => {
//     setInterval(async () => {
//         let session = await mongoose.startSession();
      
//         try {
//   await session.startTransaction();
//             let set_info = await redis.sMembers("comment-set");
//             if (set_info && set_info.length > 0) {
//                 console.log(set_info);
//                 set_info.forEach(async (x, i) => {
//                     let z = await redis.lRange(`comment-list-${x}`, 0, -1); await z.forEach(async (y, j) => {
//                         let parsed = JSON.parse(y);
//                         console.log(x);
//                         //  console.log(await bewrages_model.findOne({_id:x},{name:1}))
//                         ; await bewrages_model.findByIdAndUpdate(x, { $push: { reviews: parsed } },{session}
//                         )

//                     })
//                 });
                
//                 set_info.forEach(async (x) => { await redis.del(`comment-list-${x}`); await redis.sRem("comment-set", x) });

//             }



//         } catch (error) {
//             await session.abortTransaction();
//         }

//         finally { await session.endSession(); }
//         // console.log(infos);


//     }, 180000);
// }

// bg_fnx();




router.route('/select').get(select_cache,select_db);

router.route("/drinks" ).get(get_drinks_cache,get_drinks_db)
router.route("/search").get(search_cache,search_db)

router.route("/order/:id" ).get(order_cache,order_db);

router.route('/register').post( mw.single('file'),register)

router.route('/sign').post(sign_check,signIn);

router.route("/login").get(login_check,login_confirm);


router.route("/reviews/:id" ).get(reviews)

router.route("/publish", ).post(order_publish)


router.route("/refresh" ).get(refresh_check,refresh_token);

router.route("/user/:id").get(user_stuff)

router.route("/cancel").delete(order_cancel)
router.route("/comment/:bewrage_id").post(comment_post);
router.route("/orders_data").get(async(req,res,next)=>{
  try{  let get=await redis.hGetAll("orders");
    if(!get||get?.length<1){return res.status(200).json("No orders present")};
    let result=[];
    for(x in get){ console.log(x);
    ;let parsed=JSON.parse(get[x]);result=[...result,{data:parsed}]; };
    // console.log(result);
    
return res.send(result);
}catch(err){console.log("aaaaa");
;next(new Error(err.message))}});
// app.post("/post", mw.single('file'), async (req, res) => {

//     console.log(req.body.folder, req.body.name, req.file);


//     let upload2 = await upload(req.file.path, req.body.folder, req.body.name); let url = upload2
//     console.log(upload2);

//     let db_upload = await be wrages_model.updateOne({ name: req.body.name }, [{ $set: { image: url } }]); fs.unlinkSync(req.file.path)


// })



app.use(router)
app.use((err,req,res,next)=>{ console.log("error in handler ");console.log(err);
;res.status(400).json(err.message)
  })

app.listen(4800, () => {
    console.log('started');
})