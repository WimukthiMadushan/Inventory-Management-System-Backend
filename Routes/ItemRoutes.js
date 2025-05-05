import express from "express";
import { AddItem, GetItems, GetItemsBySiteId, EditItem, DeleteItem , IncreaseQuantity, IncreaseQuantityByOne, DecreaseQuantity, DecreaseQuantityByOne, SendItem, GetItemsByName, GetItemsPagination} from "./../Controller/ItemController.js";
const router = express.Router();

router.get("/getItems", GetItems)
router.post("/addItem", AddItem);
router.get("/getItems/:id", GetItemsBySiteId);
router.get("/getItemsByName", GetItemsByName);
router.get("/getItemsPagination", GetItemsPagination)
router.put("/updateItem/:id", EditItem);
router.delete("/deleteItem/:id", DeleteItem);
router.put("/increaseQuantity", IncreaseQuantity)
router.put("/increaseQuantityByOne", IncreaseQuantityByOne)
router.put("/decreaseQuantity", DecreaseQuantity)
router.put("/decreaseQuantityByOne", DecreaseQuantityByOne)
router.post("/sendItem", SendItem)


export default router;