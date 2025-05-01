let { bewrages_model, user_model } = require('./Models');
let { v4: uuidv4 } = require("uuid");
let {redis,mongoose}=require("./Mongo_Connect")

const reviews=async (req, res) => {

    try {
        let converted = [];
        let redis_get2 = await redis.lRange(`comment-list-${req.params.id}`, 0, -1);
        // console.log(redis_get2,typeof(redis_get2));
        if (redis_get2.length > 0) converted = redis_get2.map(x => { return JSON.parse(x) });
        console.log(req.query.page);
        let get = await bewrages_model.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            { $project: { count: { $ceil: { $divide: [{ $reduce: { input: "$reviews", initialValue: 0, in: { $add: ["$$value", 1] } } }, parseInt(req.query.limit)] } }, reviews: { $slice: ["$reviews", parseInt(req.query.page - 1) * 5, parseInt(req.query.limit)] }, _id: 0, name: 1, type: 1, rating: 1 } }
        ]);

        console.log(get);
        console.log(converted);

        const collective = { details: { name: get[0].name, rating: get[0].rating, type: get[0].type, count: get[0].count }, reviews: [...get[0].reviews, ...converted] };
        await redis.set(`reviews-${req.params.id}`, JSON.stringify(collective));


        return res.status(200).send(collective);

    } catch (err) {
        console.log("error at reviews db check", err.message)
            ; return res.status(400).send(err.message);
    }


};

const comment_post=async (req, res) => {
    let gen_id = uuidv4();


    // let get=await bewrages_model.findOneAndUpdate({_id:bewrage_id},[{$set:{reviews:{$concatArrays:["$reviews",[req.body]]}}}]);
    try {
        let data = { rating: req.body.rating, comment: req.body.comment, user: req.body.user, status: req.body.status, cmt_id: gen_id };
        let comment_list = await redis.rPush(`comment-list-${req.params.bewrage_id}`, JSON.stringify(data));

        let list_add = await redis.sAdd("comment-set", req.params.bewrage_id);
        const del = await redis.del(`reviews-${req.params.bewrage_id}`);
        console.log(del);
        res.status(200).send({ msg: "Success" })
    } catch (err) { console.log(err); res.status(400).send(err) }

};

module.exports={reviews,comment_post}