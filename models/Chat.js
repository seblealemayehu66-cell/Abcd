import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
{
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
        type: String,
        default: "open"
    }
},
{ timestamps: true }
);

export default mongoose.model("Chat", chatSchema);