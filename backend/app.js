import express from 'express'; 
const app = express();  

// import routes here 

// middleware for incoming request  
app.use(express.json()); 

// health route check 
app.get('/', (req, res) =>  {
    res.status(200).json({ 
        serverStatus: "Ok"
    }); 
}); 

// mount routes here   



export default app; 