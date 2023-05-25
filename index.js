const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5acr8wm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    client.connect();

    const dollToys = client.db("dolltopia").collection("toys");
    // const indexKeys = { title: 1 };
    // const indexOptions = { name: "title" };
    // const result = await dollToys.createIndex(indexKeys, indexOptions);

    app.get("/toys", async (req, res) => {
      const result = await dollToys.find().limit(20).toArray();
      res.json(result);
    });

    app.get("/toys/:id", async (req, res) => {
      const toy = await dollToys.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(toy);
    });

    app.get("/myToys/:email", async (req, res) => {
      const { sort } = req.query;
      const query = { sellerEmail: req.params.email };
      let sortOption = {};

      if (sort === "asc") {
        sortOption = { price: 1, _id: 1 };
      } else if (sort === "desc") {
        sortOption = { price: -1, _id: -1 };
      }

      try {
        const toys = await dollToys.find(query).sort(sortOption).toArray();

        res.send(toys);
      } catch (error) {
        console.error("Failed to fetch toy data:", error);
        res.status(500).send("Failed to fetch toy data");
      }
    });

    app.post("/addtoy", async (req, res) => {
      try {
        const toyData = req.body;
        toyData.createdAt = new Date();
        toyData.price = parseFloat(toyData.price); // Convert price to a number

        const result = await dollToys.insertOne(toyData);
        if (result?.insertedId) {
          res
            .status(200)
            .json({ message: "Toy added successfully", status: true });
        } else {
          res.status(404).json({
            message: "Unable to add toy. Please try again later.",
            status: false,
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add toy", status: false });
      }
    });

    app.get("/searchByName/:text", async (req, res) => {
      const searchName = req.params.text;
      const AllData = await dollToys.find().toArray();
      const result = AllData.filter((data) =>
        data.name.toLowerCase().includes(searchName.toLowerCase())
      );

      res.send(result);
    });

    app.patch("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const {
        pictureUrl,
        name,
        subCategory,
        price,
        rating,
        availableQuantity,
        description,
      } = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          pictureUrl: pictureUrl,
          name: name,
          subCategory: subCategory,
          price: parseFloat(price), // Convert price to a number
          rating: rating,
          availableQuantity: availableQuantity,
          description: description,
        },
      };

      const result = await dollToys.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/deleteToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      try {
        const result = await dollToys.deleteOne(filter);
        if (result.deletedCount > 0) {
          res
            .status(200)
            .json({ message: "Toy deleted successfully", status: true });
        } else {
          res.status(404).json({ message: "Toy not found", status: false });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Failed to delete toy item", status: false });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doll to Pia Is Coming!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
