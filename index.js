const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@practice.p9kdwmi.mongodb.net/?appName=Practice`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const productCollection = client.db("zolox-mart").collection("products");
    const topCollection = client.db("zolox-mart").collection("tops");
    const denimCollection = client.db("zolox-mart").collection("denims");
    const partyCollection = client.db("zolox-mart").collection("party");
    const reviewCollection = client.db("zolox-mart").collection("reviews");
    const cartCollection = client.db("zolox-mart").collection("carts");

    // Products
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    // Tops
    app.get("/tops", async (req, res) => {
      const result = await topCollection.find().toArray();
      res.send(result);
    });

    // Denims
    app.get("/denims", async (req, res) => {
      const result = await denimCollection.find().toArray();
      res.send(result);
    });
    // Party
    app.get("/party", async (req, res) => {
      const result = await partyCollection.find().toArray();
      res.send(result);
    });

    // Carts
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;

      const { email, name, brand } = cartItem;

      const existingItem = await cartCollection.findOne({
        email,
        name,
        brand,
      });

      if (existingItem) {
        return res.status(409).json({ message: "Item already in cart" });
      }

      const result = await cartCollection.insertOne(cartItem);
      res.status(201).json(result);
    });

    // Update quantity of a cart item
    app.patch("/carts/:id", async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;

      try {
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { quantity: parseInt(quantity) },
        };

        const result = await cartCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Item not found" });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Delete from cart
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/carts/selected", async (req, res) => {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No item IDs provided." });
      }

      try {
        const objectIds = ids
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        if (objectIds.length === 0) {
          return res
            .status(400)
            .json({ message: "No valid item IDs provided." });
        }

        const result = await cartCollection.deleteMany({
          _id: { $in: objectIds },
        });

        res.json({ deletedCount: result.deletedCount });
      } catch (error) {
        console.error("Error deleting items:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // MongoDB connection log
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Zolox Mart is running...");
});

app.listen(port, () => {
  console.log(`Zolox Mart server is running on port: ${port}`);
});
