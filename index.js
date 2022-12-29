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

//middle wear for varify jwt
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

        //post product
        app.post('/addproduct', async (req, res) => {

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
        app.get('/adminProduct', async (req, res) => {

            const email = req.query.email;
            const query = { seller_email: email }
            const result = await productsCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)
        })

        app.delete('/deleteProduct/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
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