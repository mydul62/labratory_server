const express = require("express");
// const jwt = require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
const app = express();
// app.use(cookieParser());
const cors = require("cors");
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("diagnostic center");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xm07hcd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("diagnosticManagement");
    const districtCollection = database.collection("districts");
    const upazillasCollection = database.collection("Upazillas");
    const AllTestCollection = database.collection("AllTest");
    const AlluserCollection = database.collection("Allusers");
    const AllBookedCollection = database.collection("allBooked");

    // Send a ping to confirm a successful connection
    app.get("/district", async (req, res) => {
      const result = await districtCollection.find().toArray();
      res.send(result);
    });
    app.get("/upazillas", async (req, res) => {
      const result = await upazillasCollection.find().toArray();
      res.send(result);
    });
    app.get("/alltests", async (req, res) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const formattedToday = today.toISOString().split("T")[0];

        const result = await AllTestCollection.find({
          date: { $gte: formattedToday },
        })
          .sort({ date: 1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("An error occurred while processing your request.");
      }
    });

    app.get("/alltests/date/:date", async (req, res) => {
      try {
        const { date } = req.params;
        console.log(`Searching for records with date: ${date}`);

        const result = await AllTestCollection.find({ date }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("An error occurred while processing your request.");
      }
    });

    app.get("/allusers", async (req, res) => {
      const result = await AlluserCollection.find().toArray();
      res.send(result);
    });
    app.get("/allusers/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { emailAdress: email };
      const result = await AlluserCollection.findOne(query);
      res.send(result);
    });
    app.get("/Alltests/tests/test/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllTestCollection.findOne(query);
      res.send(result);
    });

    app.put("/Alltests/tests/test/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { title, description, price, image, date, slot, category } =
        req.body;
      const updateDoc = {
        $set:{ title, description, price, image, date, slot, category,}
      };
     const result = await AllTestCollection.updateOne(query, updateDoc);
     res.send(result);
    });

    app.post("/alltest", async (req, res) => {
      const result = await AllTestCollection.insertOne(req.body);
      res.send(result);
    });
    app.delete("/alltest/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllTestCollection.deleteOne(query);
      res.send(result);
      console.log(id);
    });
    app.post("/alltest/Booking", async (req, res) => {
      const result = await AllBookedCollection.insertOne(req.body);
      res.send(result);
    });
    app.get("/alltest/Booking", async (req, res) => {
      const result = await AllBookedCollection.find().toArray();
      res.send(result);
    });
    app.get("/alltest/Booking/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await AllBookedCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/alltest/Booking/Delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllBookedCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/allusers", async (req, res) => {
      const result = await AlluserCollection.insertOne(req.body);
      res.send(result);
    });
    // ---------------------------------------------------
    app.patch("/allusers/Updates/update/:email", async (req, res) => {
      const email = req.params.email;
      const query = { emailAdress: email };

      const { userName, district, upazilla, imageUrl, bloodGrupe } = req.body;

      console.log("Received email:", email);

      const updateInformations = {
        $set: {
          name: userName,
          districs: district,
          upazella: upazilla,
          image: imageUrl,
          bloodGrupe: bloodGrupe,
        },
      };

      const result = await AlluserCollection.updateOne(
        query,
        updateInformations
      );
      console.log("Update result:", result);
      console.log(updateInformations);
    });

    app.patch("/alltest/slot/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateSlot = req.body.slot;
      const updatedDoc = {
        $set: {
          slot: updateSlot,
        },
      };

      const result = await AllTestCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
