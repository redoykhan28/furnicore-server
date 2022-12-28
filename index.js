const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



//middleware 
app.use(cors())
app.use(express.json())

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

        //post user
        app.post('/user', async (req, res) => {

            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)

        })

        //get te categories
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
            const query = { category_name: name }
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

    }

    finally {

    }
}

run().catch(console.dir)



app.listen(port, () => {

    console.log(`Furnicore runs on port ${port}`)

})