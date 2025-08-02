import express from "express";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favouritesTable } from "./db/schema.js";
import { and, eq } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();

const PORT = ENV.PORT || 5001;
if (ENV.NODE_ENV === "production") job.start();
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});
app.use(express.json());

app.delete("/api/favourites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    if (!userId || !recipeId) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    await db
      .delete(favouritesTable)
      .where(
        and(
          eq(favouritesTable.userId, userId),
          eq(favouritesTable.recipeId, parseInt(recipeId))
        )
      );
    res.status(200).json({ message: "Favourite removed successfully" });
  } catch (error) {
    console.log("error removing", error);
    res.status(500).json({ error: "something went wrong" });
  }
});
app.post("/api/favourites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;
    if (!userId || !recipeId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newFavourite = await db
      .insert(favouritesTable)
      .values({ userId, recipeId, image, servings, title, image, cookTime })
      .returning();
    res.status(201).json(newFavourite[0]);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "something went wrong" });
  }
});
app.get("/api/favourites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const useFavourite = await db
      .select()
      .from(favouritesTable)
      .where(eq(favouritesTable.userId, userId));

    res.status(200).json(useFavourite);
  } catch (error) {
    console.log("error fetching", error);
    res.status(500).json({ error: "something went wrong" });
  }
});
