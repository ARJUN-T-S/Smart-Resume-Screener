import express from "express"
import AuthMiddleware from "../Middlewares/Auth"
import otherController from "../Controllers/OtherController"

const router=express.Router();

router.get('/getGroupsForJd/:groupId',AuthMiddleware.Auth,otherController.getJobDesc);