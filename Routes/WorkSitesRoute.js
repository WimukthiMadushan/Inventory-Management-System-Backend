import express from "express";
import {GetAllSites, AddSite,DeleteWorkStation,UpdateWorkStation} from "./../Controller/WorkSitesController.js";
const router = express.Router();

router.get("/getSites", GetAllSites)
router.post("/addSite", AddSite)
router.delete("/deleteSite/:id", DeleteWorkStation)
router.put("/updateSite/:id", UpdateWorkStation)

export default router;