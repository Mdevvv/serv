import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 7777;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'site')));

let captchaUsers = []


app.get('/captcha/start', (req, res) => {
    

    if(req.query.id) {
        try {
            captchaUsers.push(parseInt(req.query.id, 10))

        } catch (error) {
            
        }
    }

});

app.get('/captcha/end', (req, res) => {
    if(req.query.id) {
        const targetTimestamp = parseInt(req.query.id, 10)
        try {
            if (captchaUsers.includes(targetTimestamp)) {
                const currentTimestamp = Date.now() // Obtenir le timestamp actuel en secondes
                const timeDifference = currentTimestamp - targetTimestamp;
                if(timeDifference > 1000) {
                    res.status(200).end();
                } else {
                    res.status(404).end();
                }
                
                captchaUsers = captchaUsers.filter(item => item !== targetTimestamp);
            }
        } catch (error) {
            
        }

    }

});



app.listen(port, () => {
    console.log(`Server on http://localhost:${port}/`);
});