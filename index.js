const express = require('express')
const cors = require('cors')
const app = express()
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
require('dotenv').config()


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access request' })
    }

    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access request' })
        }
        req.decoded = decoded
        next()
    })
}


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


        // JWT  
        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })

            res.send({ token })
        })

        // user apis

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'fobidden request' })
            }

            next()
        }

        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

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

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded?.email !== email) {
                res.send({ admin: false })
            }

            else {
                const query = { email: email }
                const user = await userCollection.findOne(query);
                const result = { admin: user?.role === 'admin' }
                res.send(result)
            }
        })

        app.patch('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        // cart apis
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }

            else if (req.decoded.email !== email) {
                res.status(401).send({ error: true, message: 'unauthorized access request' })
                console.log(req.decoded.email, email);
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



        app.post('/menu', verifyJWT, async (req, res) => {
            const menuItem = req.body;
            const result = await menuCollection.insertOne(menuItem)
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
