let cloud = require('cloudinary').v2;

cloud.config({ cloud_name: "dfibwqcmx", api_key: "537772646948454", api_secret: "V2kci-CL6SHsVogWgZX0GWwI4MI" });


const upload_fnx = async (file, folder) => { let get = await cloud.uploader.upload(file, { folder: `Bewrages/${folder}` });
 ;let crop=await cloud.url(get.public_id,{height:250,width:150});return crop }



module.exports = upload_fnx;
