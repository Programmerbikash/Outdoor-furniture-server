const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.REACT_FURNITURE_USER}:${process.env.REACT_FURNITURE_PASSWORD}@cluster0.ik3p7tj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri);

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const furnitureCollection = client.db("outdoorFurniture").collection("furniture");
        const allProductCollection = client.db("outdoorFurniture").collection("allProduct");
        const buyingCollection = client.db("outdoorFurniture").collection("buying");
        const usersCollection = client.db("outdoorFurniture").collection("users");
        const addProductCollection = client.db("outdoorFurniture").collection("addProduct");
        const trandingCollection = client.db("outdoorFurniture").collection("tranding");
        const newDesignCollection = client.db("outdoorFurniture").collection("newDesign");
        
        // Admin Middleware
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        // Seller Middleware
        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.category!== 'Seller') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/furniture', async (req, res) => {
            const query = {}
            const result = await furnitureCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/allProduct', async (req, res) => {
            const query = {}
            const result = await allProductCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/trandingFurniture', async (req, res) => {
            const query = {}
            const result = await trandingCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/newDesign', async (req, res) => {
            const query = {}
            const result = await newDesignCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/allProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { service_id: id };
            const result = await allProductCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/singleProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await allProductCollection.find(query).toArray();
            res.send(result);
        })

        /**
         * API naming convention
         * app.get('/buying')
         * app.get('/buying/:id')
         * app.post('/buying')
         * app.patch('/buying/:id')
         * app.delete('/buying/:id')
         */

        app.get('/buying', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(req.headers.authorization);
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = {email: email}
            const result = await buyingCollection.find(query).toArray();
            res.send(result)
            // console.log(email);
        })

        app.post('/buying', async (req, res) => {
            const buying = req.body;
            const query = {
                service_name: buying.service_name,
                email: buying.email
            }

            const alreadyBuying = await buyingCollection.find(query).toArray();

            if (alreadyBuying.length) {
                const message = `You buyed the ${buying.service_name}`
                return res.send({ alreadyBuying: false, message })
            }

            const result = await buyingCollection.insertOne(buying);
            res.send(result)
            // console.log(buying);
        })
        
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
            console.log(user);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        // Seller API
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.category === 'Seller' });
        })

        app.get('/seller/addProduct', verifyJWT, verifySeller, async (req, res) => {
            const query = {};
            const myProduct = await addProductCollection.find(query).toArray();
            res.send(myProduct);
        })

        app.post('/seller/addProduct', verifyJWT, async (req, res) => {
            const product = req.body;
            console.log(product);
            const result = await addProductCollection.insertOne(product);
            res.send(result);
        })

        app.delete('/seller/addProduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await addProductCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.category === 'User' });
        })

         app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
         });
        
         app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

    } finally {
        
    }
}
    run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('Outdoor-furniture is running');
})

app.listen(port, () => console.log(`Outdoor-furniture running on ${port}`))