let multer=require('multer');


let mw=multer({storage:multer.memoryStorage()});


module.exports=mw