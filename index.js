const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000
//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amtie.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 

async function run() {
try{
    await client.connect();
    const productCollection = client.db('laptop-parts').collection('product');
    const purchaseCollection = client.db('laptop-parts').collection('purchases');
    const userCollection = client.db('laptop-parts').collection('user');


    app.get('/purchase', async (req,res) => {
      const query = {}
      const cursor= productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get('/purchase/:id', async(req, res) =>{
        const id = req.params.id;
        const query= {_id: ObjectId(id)};
        const product = await productCollection.findOne(query);
        res.send(product);
    })
// to get purchase list
    app.get('/purchase', async(req,res) =>{
        const Email= req.query.Email;
        const query = {Email: Email};
        const purchases = await purchaseCollection.find(query).toArray();
        res.send(purchases)
    })

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
        res.send()

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