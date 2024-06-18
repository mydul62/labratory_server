const express = require("express");
const jwt = require('jsonwebtoken')
const app = express();
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
    const blogCollections = database.collection("blog");
    const allRecomendations = database.collection("recomendation");




// -------------------------------------------jwt--------------------------------

// middlewires 
const verifyToken =(req,res,next) => {
 console.log("inside verify token",req.headers.authorization);
 if(!req.headers.authorization){
 return res.status(401).send({message:'unauthorized access'})
 }
 const token = req.headers.authorization.split(" ")[1];
   jwt.verify(token,process.env.DB_ACCESS_TOKEN_SECRET_KEY,(error,decoded)=>{
     if(error){
       return res.status(401).send({message:'unauthorized access'})
     }
     req.decoded = decoded;
       next()
   })
}


const verifyAdmin = async(req,res,next)=> {

  const email = req.decoded.email;
  const query = {emailAdress:email}
  const user = await AlluserCollection.findOne(query);
  const isAdmin = user.role === "admin";
  console.log(query,user);
  if(!isAdmin){
    return res.status(403).send({message:'forbiddem access'})
  
  }
  next();
  
   }


app.post('/jwt',async(req,res)=>{
  const user = req.body;
   const token =jwt.sign(user,process.env.DB_ACCESS_TOKEN_SECRET_KEY,{expiresIn:'24h'});
   res.send({token})
})







    // Send a ping to confirm a successful connection
    app.get("/district", async (req, res) => {
      const result = await districtCollection.find().toArray();
      res.send(result);
    });
    app.get("/upazillas", async (req, res) => {
      const result = await upazillasCollection.find().toArray();
      res.send(result);
    });
    
    
    app.get("/blogs", async (req, res) => {
      const result = await blogCollections.find().toArray();
      res.send(result);
    });
    
    
    
    app.get("/alltests", async (req, res) => {
    const searchDate = req.query.search
    console.log(searchDate);
     if(searchDate){
       const quary = {date: searchDate}
       result = await AllTestCollection.find(quary).toArray();
       res.send(result);
     }else{
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); 
        const formattedToday =  today.toISOString().split('T')[0];
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
     }
    });
    
    
    
    app.get("/alltests/adminAlltests",async (req, res) => {
        const result = await AllTestCollection.find().toArray();
        res.send(result);
    });

   

    app.get("/allusers",verifyToken,verifyAdmin, async (req, res) => {
      const result = await AlluserCollection.find().toArray();
      res.send(result);
    });
    app.get("/allusers/email/:email",async (req, res) => {
      const email = req.params.email;
      const query = { emailAdress: email };
      const result = await AlluserCollection.findOne(query);
      res.send(result);
    });
    app.get("/allusers/email/isadmin/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message:'forbiddem access'})
      }
      const query = { emailAdress: email };
      const user = await AlluserCollection.findOne(query);
       let admin = false;
       if(user){
       admin = user.role === "admin";
       }
       res.send({admin})
       
    });
    
    
    app.get("/Alltests/tests/test/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllTestCollection.findOne(query);
      res.send(result);
    });

    app.put("/Alltests/tests/test/update/:id",verifyToken,verifyAdmin, async (req, res) => {
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

    app.post("/alltest",verifyToken,verifyAdmin,async (req, res) => {
      const result = await AllTestCollection.insertOne(req.body);
      res.send(result);
    });
    app.delete("/alltest/delete/:id",verifyToken,verifyAdmin, async (req, res) => {
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
    
    
    
    app.get("/alltest/Booking/features", async (req, res) => {
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); // Set UTC hours to start of the day
    
        const todayDateString = today.toISOString().split('T')[0];
    
        const result = await AllBookedCollection.aggregate([
          {
            $match: {
              appontmentData: { $gte: todayDateString } // Filter for dates from today onwards
            }
          },
          {
            $sort: { BookedDate: 1 } // Sort by BookedDate in ascending order
          },
          {
            $group: {
              _id: "$bookingId", // Group by bookingId to remove duplicates
              latestBooking: { $first: "$$ROOT" } // Get the first document in each group
            }
          },
          {
            $replaceRoot: { newRoot: "$latestBooking" } // Replace the root with the latestBooking document
          }
        ]).toArray();
    
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
      }
    });
    
    
    
    
    
    
    app.get("/alltest/Booking/reservations/:id",verifyToken,verifyAdmin, async (req, res) => {
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
    
    app.get("/alltest/Booking/reservations/search/search-item",verifyToken,verifyAdmin, async (req, res) => {
      const { id, email } = req.query;    
      if (!id || !email) {
        return res.status(400).send('Both id and email are required');
      }
    
      try {
        const query = { userEmail: email, bookingId: id };
        const result = await AllBookedCollection.find(query).toArray();
    
        if (result.length === 0) {
          console.log('No data found for query:', query);
          return res.status(404).send('No data found');
        }
    
        console.log('Query successful, data found:', result);
        res.send(result);
      } catch (error) {
        console.error('Error fetching data from MongoDB', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    
    app.delete("/alltest/Booking/Delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllBookedCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/allTests/booking/booking-result/submit-result",verifyToken,verifyAdmin, async (req, res) => {
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
    
    app.get("/testResults/:email",async (req, res) => {
    const email = req.params.email;
    console.log(email);
    const quary = {userEmail:email}
     const result = await AllappointmentResult.find(quary).toArray();
    res.send(result);
    
    })
    
    app.patch("/allTests/booking/statusUpdate/status/:id",verifyToken,verifyAdmin, async (req, res) => {
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
    app.patch("/allusers/status/:email",verifyToken,verifyAdmin, async (req, res) => {
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
    app.patch("/allusers/user_role/role/:email",verifyToken,verifyAdmin, async (req, res) => {
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
    app.patch("/allusers/Updates/update/:email",verifyToken,async (req, res) => {
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


   app.get("/all_banners",verifyToken,verifyAdmin,async(req, res) => {
    const result = await AllBannerCollection.find().toArray();
   res.send(result);
   
   })
   app.post("/all_banners",verifyToken,verifyAdmin,async(req, res) => {
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
  
  app.put("/all_banners/:id",verifyToken,verifyAdmin,async(req, res) => {
     const id = req.params.id;
     await AllBannerCollection.updateMany({}, { $set: { isActive: false } });
     const result = await AllBannerCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: true } }
    );
    res.send(result);
     console.log(id);
    })
  app.delete("/all_banners/delete/:id",verifyToken,verifyAdmin,async(req, res) => {
     const id = req.params.id;
     const quary = {_id: new ObjectId(id) }
     const result = await AllBannerCollection.deleteOne(quary);
     res.send(result);
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

// ---------------------------------------------------------------------------------------- chats data 

async function getAggregatedData(req, res) {
  try {
    // Aggregation pipeline
    const pipeline = [
      // {
      //     $match: {
      //         userEmail: "mydulcse62.niter@gmail.com" // replace with the actual email to filter by
      //     }
      // },
      {
        $addFields: {
            convertedBookingId: { $toObjectId: "$bookingId" }
        }
    },
    {
        $lookup: {
            from: "AllTest",
            localField: "convertedBookingId",
            foreignField: "_id",
            as: "testDetails"
        }
    },
      {
          $unwind: "$testDetails"
      },
      {
          $group: {
              _id: "$bookingId",
              totalBooking: { $sum: 1 },
              title: { $first: "$testDetails.title" }
          }
      },
      {
          $project: {
              _id: 1,
              title: 1,
              totalBooking: 1
          }
      }
  ];
  

    // Run the aggregation
    const results = await AllBookedCollection.aggregate(pipeline).toArray();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  } finally {
    // Close the MongoDB connection (if necessary)
  }
}

// Define a route to get the aggregated data
app.get('/aggregated-data', getAggregatedData);


// ---------------------------------------------------------------------------------------- chats data 

app.get('/recomendations/recomendation',async(req, res)=>{
  const result = await allRecomendations.find().toArray();
  res.send(result);
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
