const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
require('dotenv').config()



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.qmhrwse.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const reviewCollecton = client.db('bistroDb').collection('reviews')
        const menuCollection = client.db('bistroDb').collection('menu')
        const cartCollection = client.db('bistroDb').collection('carts')
        const userCollection = client.db('bistroDb').collection('users')

        // user apis
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: req.body.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                res.send({ message: 'user already exist' })
            }
            else {
                const result = await userCollection.insertOne(user)
                res.send(result)
            }
        })

        // cart apis
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }
            else {
                const query = { email: email }
                const result = await cartCollection.find(query).toArray()
                res.send(result)
            }
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/carts', async (req, res) => {
            const item = req.body
            console.log(item);
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })

        app.get('/menu', async (req, res) => {
            if (req.query.category) {
                const category = req.query.category
                const query = { category: category }
                const result = await menuCollection.find(query).toArray()
                res.send(result)
            }
            else {
                const result = await menuCollection.find().toArray()
                res.send(result)
            }
        })

        app.get('/reviews', async (req, res) => {
            const result = await reviewCollecton.find().toArray()
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
