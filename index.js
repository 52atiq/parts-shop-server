const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000
//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amtie.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 

function verifyJWT(req, res, next){
   const authHeader = req.headers.authorization;
   if(!authHeader){
       return res.status(401).send({message: 'UnAuthorized access'})
   }
   const token = authHeader.split(' ')[1];
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
       if(err){
      return res.status(403).send({message: 'Forbidden access'})
       }
       req.decoded = decoded;
       next();
    //    console.log(decoded);

   })
}

async function run() {
try{
    await client.connect();
    const productCollection = client.db('laptop-parts').collection('product');
    const purchaseCollection = client.db('laptop-parts').collection('purchases');
    const userCollection = client.db('laptop-parts').collection('user');
    const reviewsCollection = client.db('laptop-parts').collection('reviews');
    const addProductCollection = client.db('laptop-parts').collection('addProduct');
    


    app.get('/purchase', async (req,res) => {
      const query = {}
    //   const cursor= productCollection.find(query).project({name:1});
      const cursor= productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get('/purchase/:id', async(req, res) =>{
        const id = req.params.id;
        const query= {_id: ObjectId(id)};
        const product = await productCollection.findOne(query);
        res.send(product);
    });
// to get purchase list
    app.get('/purchase', verifyJWT, async(req,res) =>{
        const Email= req.query.Email;
       
        const decodedEmail = req.decoded.email;
        if(Email === decodedEmail){
            const query = {Email: Email};
            const purchases = await purchaseCollection.find(query).toArray();
            res.send(purchases)
        }
        else{
            return res.status(403).send({message: 'forbidden access'});
        }
    });

    app.post('/purchase', async(req,res) =>{
        const purchase = req.body;
        const query = {productName: purchase.productName, Email:purchase.Email}
        const exists = await purchaseCollection.findOne(query);
        if(exists){
            return res.send({success: false, purchase: exists})
        }
        const result = await purchaseCollection.insertOne(purchase);
        return  res.send( { success: true, result} );
    })

    app.put('/user/:email', async(req,res) =>{
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result =await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
        res.send({result,  token});

    });

      app.get('/admin/:email', async(req, res) =>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin});
      })

    //  admin api 
    app.put('/user/admin/:email', verifyJWT, async(req,res) =>{
        const email = req.params.email;
       const requester = req.decoded.email;
       const requesterAccount = await userCollection.findOne({email: requester});
       if(requesterAccount.role === 'admin'){
        const filter = { email: email };
        const updateDoc = {
          $set:{role: 'admin'},
        };
        const result =await userCollection.updateOne(filter, updateDoc);
        res.send(result);
       }
       else{
           res.status(403).send({message: 'forbidden'})
       }
       

    });

    app.get('/user' , async(req,res) =>{
    // app.get('/user' ,verifyJWT, async(req,res) =>{
    const users = await userCollection.find().toArray();
    res.send(users);
    })



      //Add review api
      app.post('/reviews', async (req, res) => {
        const reviews = req.body;
        console.log('hit the post api', reviews);
        const result = await reviewsCollection.insertOne(reviews);
        console.log(result);
        res.send(result);
    });

    //get review api
      app.get('/reviews', async (req, res) => {
          const query ={}
        const cursor = reviewsCollection.find(query);
        const Reviews = await cursor.toArray();
        res.send(Reviews);
    });

    // add product api
    app.post('/addProduct',  async(req, res) =>{
        const addProduct = req.body;
        const result = await addProductCollection.insertOne(addProduct);
        res.send(result);
    })

    //load product api
    app.get('/addProduct', async(req, res) =>{
        const addProducts = await addProductCollection.find().toArray();
        res.send(addProducts)
    }) 

   

}
finally{

}
}

run().catch(console.dir);

app.get('/', (req,res) =>{
    res.send('Running laptop-parts server');
});

app.listen(port, () =>{
    console.log('Listening to port', port);
})