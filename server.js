const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot aktif dan siap!');
});

app.listen(3000, () => {
    console.log('🌐 Server web aktif di port 3000');
});