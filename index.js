const express = require('express')
const app = express()
const cors=require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const { json } = require('express');
const admin = require("firebase-admin");



const port = process.env.PORT || 5000;

// doctors-portal-firebase-adminsdk.json



const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
admin.initializeApp({
    credential:admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uyn9t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect();
        const database=client.db('Dserver');
        const appointmentCollection=database.collection('appointments');
        const usersCollection=database.collection('users');


        app.get('/appointments',verifyToken,async(req,res)=>{
            const email=req.query.email;
            const date=new Date(req.query.date).toLocalDateString();
            
            const query={email:email,date:date} 
            console.log(query);
            const cursor=appointmentCollection.find(query);
            const appointments= await cursor.toArray();
            res.json(appointments);


        })



        app.post('/appointments',async(req,res)=>{
          const appointment=req.body;
          const result=await appointmentCollection.insertOne(appointment);
          res.json(result)

        });
        app.get('/users/email',async(req,res)=>{
            const email=req.params.email;
            const query={email:email};
            const user=await usersCollection.findOne(query);
            let isAdmin=false;
            if(user?.role==='admin'){
                isAdmin=true;

            }
            res.json({admin:isAdmin});

        })

        app.post('/users',async(req,res)=>{
            const user=req.body;
            const result=await usersCollection.insertOne(user);
            console.log(result)
            res.json(result)
        });




        app.put('/user',async(req,res)=>{
            const user=req.body;
            const filter={email:user.email};
            const options = { upsert: true };
            const updateDoc={$set:user};
            const result=await usersCollection.updateOne(filter,updateDoc,options);
            res.json(result);


        })
        async function verifyToken(req,res,next){

            if(req.headers?.authorization?.startsWith('Bearer')){
              const token=req.headers.authorization.split('')[1];
            
              try{
                const decodedUser=await admin.auth().verifyToken(token);
                req.decodedEmail=decodedUser.eamil;
            
              }
              catch{
            
              }
            }
            
              next();
            }
        app.put('/users/admin',async(req,res)=>{
            const user=req.body;
            const requester=req.decodedEmail;

            if(requester){
                const requesterAccount=usersCollection.findOne({email:requester});
                if(requesterAccount.role==='admin'){
                    const filter={email:user.email};
                    const updateDoc={$set:{role:'admin'}};
                    const result=await usersCollection.updateOne(filter,updateDoc);
                    res,json(result);

                }
            }
            else{
                res.status(401).json({message:'you do not have acces to this website '})
            }

        })


    }
    finally{
        //await client.close();

    }

}

run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello doctors world!')
})

app.listen(port, () => {
  console.log(`listening at ${port}`)
})

// app.get('/users')
// app.post('/users')
// app.delete('/users/:id')