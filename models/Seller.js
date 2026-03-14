import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
{
userId:{
type: mongoose.Schema.Types.ObjectId,
ref:"User"
},

shopName:{
type:String,
required:true
},

email:{
type:String,
required:true
},

idDocument:{
type:String
},

invitationCode:{
type:String
},

emergencyContact:{
type:String,
required:true
},

address:{
type:String,
required:true
},

   isApproved: { type: Boolean, default: false },

},
{timestamps:true}
);

export default mongoose.model("Seller",sellerSchema);

