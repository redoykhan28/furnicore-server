const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



//middleware 
app.use(cors())
app.use(express.json())

//middlewear for varify jwt
function jwtVerify(req, res, next) {

    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if (!authHeader) {

        return res.status(401).send('Unothorized User')
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {

        if (error) {

            return res.status(403).send('Forbbiden access')
        }

        req.decoded = decoded

        next()

    })

}


app.get('/', (req, res) => {

    res.send('Furnicore Running on Server')
})

//useing mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ytkvvxy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {

        //create collection of categories
        const categoriesCollection = client.db('Furnicore').collection('categories')

        //create collection of products
        const productsCollection = client.db('Furnicore').collection('products')

        //create collection of users
        const usersCollection = client.db('Furnicore').collection('users')

        //create collection of users
        const ordersCollection = client.db('Furnicore').collection('orders')

        //post user
        app.post('/user', async (req, res) => {

            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)

        })


        //verify admin
        const verifyAdmin = async (req, res, next) => {

            //verify
            const decodedEmail = req.decoded.email;
            const AdminQuery = { email: decodedEmail }
            const user = await usersCollection.findOne(AdminQuery)

            if (user?.role !== 'admin') {

                return res.status(403).send('Forbidden Access');
            }
            next()

        }

        //post product
        app.post('/addproduct', jwtVerify, async (req, res) => {

            const product = req.body
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

        //post order
        app.post('/orders', async (req, res) => {

            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })


        //get jwt by user email
        app.get('/jwt', async (req, res) => {

            const email = req.query.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)

            //send jwt to client
            if (user) {

                const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
                return res.send({ accessToken: token })

            }

            res.status(403).send({ accessToken: '' })

        })

        //get admin user to authorized route
        app.get('/user/admin/:email', async (req, res) => {

            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send({ isAdmin: result?.role === 'admin' })

        })


        //get categories
        app.get('/users', async (req, res) => {

            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        //get categories
        app.get('/categories', async (req, res) => {

            const query = {}
            const result = await categoriesCollection.find(query).toArray()
            res.send(result)
        })

        //get product
        app.get('/allproduct', async (req, res) => {

            const query = {}
            const result = await productsCollection.find(query).sort({ _id: -1 }).limit(6).toArray()
            res.send(result)

        })

        //get total product
        app.get('/totalproduct', async (req, res) => {

            const query = {}
            const result = await productsCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)

        })

        //get products based on cat name
        app.get('/products/:name', async (req, res) => {

            const name = req.params.name;
            const query = { category: name }
            const result = await productsCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)
        })

        //get product details by id
        app.get('/productDetails/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        //get admin product
        app.get('/adminProduct', jwtVerify, verifyAdmin, async (req, res) => {

            const email = req.query.email;
            const query = { seller_email: email }
            const result = await productsCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)
        })

        //get admin orders
        app.get('/orderlist', jwtVerify, verifyAdmin, async (req, res) => {

            const email = req.query.email;
            const query = { seller_email: email };
            const result = await ordersCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)

        })


        //get order details by id
        app.get('/orderDetails/:id', jwtVerify, verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.findOne(query)
            res.send(result)
        })


        app.delete('/deleteProduct/:id', jwtVerify, verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            res.send(result)

        })

        app.delete('/deleteOrder/:id', jwtVerify, verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)

        })


        //put products for advertise
        app.put('/orderUpdate/:id', jwtVerify, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {

                    orderConfirm: "confirmed"
                }
            }
            const result = await ordersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

    }

    finally {

    }
}

run().catch(console.dir)



app.listen(port, () => {

    console.log(`Furnicore runs on port ${port}`)

})