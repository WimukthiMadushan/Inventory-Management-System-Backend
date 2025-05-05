import express from 'express';
const router = express.Router();
import { signup, signin, getAllUsersByPagination,getAllManagers,getAllAdmins } from './../Controller/AuthController.js';

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/getusersbypagination", getAllUsersByPagination)
router.get("/getmanagers", getAllManagers);
router.get("/getadmins", getAllAdmins);

export default router;