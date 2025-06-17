let { bewrages_model, user_model } = require('./Models');
let {redis}=require("./Mongo_Connect")


const get_drinks_cache=async (req, res, next) => {

    try {
        let get = await redis.get(`drinks-${req.query.category}`);
        if (get) {
            console.log("sending from cache");

            return res.status(200).send(JSON.parse(get))
        } else {
            console.log("no cache found");
            ; return next()
        }
    } catch (err) { return res.status(400).send(err.message) }
};

const get_drinks_db= async (req, res) => {

    // console.log(req.query);
    console.log("from db");
    try {
        let get = req.query.category == 'All' ?
            await bewrages_model.find({}, { reviews: 0 }) :
            await bewrages_model.find({ type: req.query.category }, { reviews: 0 });
        // console.log(get);

        await redis.set(`drinks-${req.query.category}`, JSON.stringify(get));

        res.status(200).send(get)
    } catch (err) {
        res.status(400).json(err)
    }


}

const select_cache=async (req, res, next) => {
    try {
        let get = await redis.get(`select`);
        if (get) {
            console.log("sending from cache");

            return res.status(200).send(JSON.parse(get))
        } else {
            console.log("no cache found");
            ; return next()
        }
    } catch (err) { return res.status(400).send(err.message) }
};

const select_db=async (req, res) => {
    console.log('got');
    try {
        let get = await bewrages_model.aggregate([{ $match: {} }, { $group: { _id: "$type" } }, { $sort: { _id: -1 } }])
        await redis.set("select", JSON.stringify(get))
        // console.log(get);
        res.status(200).send(get);
    }

    catch (err) {
        console.log(err); res.status(400).json("Operation failed")
    }






};

const search_cache= async (req, res, next) => {
    try {
        let find = await redis.get(`drinks-All`); 

        if (find) {
            let filter = JSON.parse(find).filter((x, i) => { return x.name.toLowerCase().includes(req.query.value.toLowerCase()) }); console.log(filter);


            ; return res.status(200).send(filter)
        }else next()
    } catch (err) { next(err) }
};

const search_db=async (req, res) => {
        let regex = new RegExp(req.query.value, "i");
        try {

            let get = await bewrages_model.find({ name: regex }); res.status(200).send(get)
        } catch (err) {
            console.log(err.message);
            ; res.status(400).json(err.message)
        }
    }

const user_stuff=async (req, res) => {

    // console.log(req.cookies);
    try {
        let get_redis_user = await redis.lRange(req.params.id, 0, -1); console.log(get_redis_user);
        let parsed = get_redis_user.map(x => JSON.parse(x));
        console.log(parsed);


        let get_user = await user_model.findOne({ _id: req.params.id });


      return  res.status(200).send({ user: get_user, orders: parsed });

    } catch (err) {
        console.log(err.message)
        return res.status(400).send(err)
    }
};

    module.exports={get_drinks_cache,get_drinks_db,search_cache,search_db,select_cache,select_db,user_stuff,};