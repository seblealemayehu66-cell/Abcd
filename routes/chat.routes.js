import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


/* CREATE CHAT */

router.post("/create", authMiddleware, async (req,res)=>{

    try{

        const chat = await Chat.create({
            customer:req.user.id
        });

        res.json(chat);

    }catch(err){
        res.status(500).json({message:"Chat create failed"});
    }

});


/* GET CUSTOMER CHAT */

router.get("/mychat", authMiddleware, async (req,res)=>{

    const chat = await Chat.findOne({
        customer:req.user.id
    });

    res.json(chat);

});


/* GET MESSAGES */

router.get("/messages/:chatId", authMiddleware, async (req,res)=>{

    const messages = await Message.find({
        chatId:req.params.chatId
    }).populate("sender","name");

    res.json(messages);

});


/* SEND MESSAGE */

router.post("/message", authMiddleware, async (req,res)=>{

    const {chatId,text} = req.body;

    const message = await Message.create({

        chatId,
        sender:req.user.id,
        text

    });

    res.json(message);

});

export default router;