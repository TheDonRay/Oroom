import 'dotenv/config'; 
import app from './app.js'; 

// import database call  



const PORT = process.env.PORT;  

app.listen(PORT, () => { 
    console.log(`Server successfully running on: http://localhost:${PORT}`); 
}); 

