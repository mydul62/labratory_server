const express = require("express");
// const jwt = require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
const app = express();
// app.use(cookieParser());
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.DB_STRIPR_SECRET_KEY);
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
    const AllBannerCollection = database.collection("banner");
    const AllappointmentResult = database.collection("appointmentResult");

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
    app.get("/alltests/adminAlltests", async (req, res) => {
        const result = await AllTestCollection.find() .toArray();
        res.send(result);
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
    app.get("/alltest/Booking/reservations/:id", async (req, res) => {
    const id = req.params.id;
    const query = { bookingId:id};
      const result = await AllBookedCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/alltest/Booking/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await AllBookedCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/alltest/Booking/reservations/search", async (req, res) => {
      const id = req.query.id;
      const email = req.query.email;
      
      console.log(`Received search request with id: ${id} and email: ${email}`);
      
      if (!id || !email) {
        res.status(400).send("ID and email are required");
        return;
      }
      
      try {
        const query = { userEmail: email };
        console.log(`Querying database with: ${JSON.stringify(query)}`);
        
        const result = await AllBookedCollection.find(query).toArray();
        console.log(`Query result: ${JSON.stringify(result)}`);
        
        if (result.length === 0) {
          res.status(404).send("No reservations found");
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error("Database query failed", error);
        res.status(500).send("Internal Server Error");
      }
    });
    
    app.delete("/alltest/Booking/Delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllBookedCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/allTests/booking/booking-result/submit-result", async (req, res) => {
      try {
        const reservation = req.body;
        if (!reservation) {
          return res.status(400).send({ error: "Invalid reservation data" });
        }
        const result = await AllappointmentResult.insertOne(reservation);
        res.status(201).send(result);
        console.log(reservation);
      } catch (error) {
        console.error('Error inserting reservation:', error);
        res.status(500).send({ error: "Internal server error" });
      }
    });
    
    app.patch("/allTests/booking/statusUpdate/status/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateStatus= req.body.status;
      const updatedDoc = {
        $set: {
          status: updateStatus,
        },
      }; 
      const result = await AllBookedCollection.updateOne(query, updatedDoc);
      res.send(result);
      console.log(id, updateStatus);
    });
  
    app.post("/allusers", async (req, res) => {
      const result = await AlluserCollection.insertOne(req.body);
      res.send(result);
    });
    app.patch("/allusers/status/:email", async (req, res) => {
      const email = req.params.email;
      const quary = {emailAdress:email}
      const updateStatus= req.body.status;
      const updatedDoc = {
        $set: {
          status: updateStatus,
        },
      }; 
      const result = await AlluserCollection.updateOne(quary, updatedDoc);
      res.send(result);
      console.log(updateStatus);
      });
    app.patch("/allusers/user_role/role/:email", async (req, res) => {
      const email = req.params.email;
      const quary = {emailAdress:email}
      const updateStatus= req.body.role;
      const updatedDoc = {
        $set: {
          role: updateStatus,
        },
      }; 
      const result = await AlluserCollection.updateOne(quary, updatedDoc);
      res.send(result);
      console.log(updateStatus,email);
      console.log(result);
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
      res.send(result);
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
    
    
    // ----------------------------------------------------------------all banners\


   app.get("/all_banners",async(req, res) => {
    const result = await AllBannerCollection.find().toArray();
   res.send(result);
   
   })
   app.post("/all_banners",async(req, res) => {
   const bannerData = req.body;
   const result = await AllBannerCollection.insertOne(bannerData);
      res.send(result);
   
   })
   app.get('/all_banners/banners/:isActive', async (req, res) => {
    const isActive = req.params.isActive === 'true'; 
    try {
      const query = { isActive };
      const result = await AllBannerCollection.findOne(query);
      res.json(result);
    } catch (error) {
      console.error('Error fetching banner:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put("/all_banners/:id",async(req, res) => {
     const id = req.params.id;
     await AllBannerCollection.updateMany({}, { $set: { isActive: false } });
     const result = await AllBannerCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: true } }
    );
    res.send(result);
     console.log(id);
    })
    
   
app.get("/all_banners/getpromo", async (req, res) => { 
  const couponCode = req.query.couponCode;
  const quary = {couponCode}
  if (couponCode) { 
  console.log(couponCode);
       const result = await AllBannerCollection.findOne(quary);
       res.send(result);
  } else {
      res.status(400).send({ success: false, message: "No promo code provided" });
  }
});



// -------------------paymet ------------------

app.post("/create-payment-intent", async (req, res) => {
const price = req.body.price;
const amaount = parseFloat(price) * 100;
if(!price || amaount<1) {
return;
}
const {client_secret} = await stripe.paymentIntents.create({
  amount: amaount,
  currency: "usd",
  // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
  automatic_payment_methods: {
    enabled: true,
  },

}) 
res.send({clientSecret:client_secret})

})

    
    

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
