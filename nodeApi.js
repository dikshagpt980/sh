let express = require("express");
let app = express();
app.use(express.json());
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin ,X-Requested-With, Content-Type, Accept"
    );
    next();
});

var port = process.env.PORT || 2410;
app.listen(port ,()=> console.log(`Node app listening on port ${port}!`));

const {Client} = require("pg");
const client = new Client({
    user: "postgres",
    password: "Duggu@2001Papa",
    database: "postgres",
    port: 5432,
    host: "db.ffhhvxasbtqicprsjdka.supabase.co",
    ssl: {rejectUnauthorized: false}
});

client.connect(function(res,error){
    console.log("Connected!!!");
});

let {data} = require("./data.js");

app.get("/shops",function(req,res,next){
    let query = `SELECT * FROM shops`;
    client.query(query,function(err,result){
        if(err){
            res.status(400).send(err);
        }
        res.send(result.rows);
    });
})

app.post("/shops",function(req, res, next){
    let body = Object.values(req.body);
    let query = `INSERT INTO shops(name, rent) VALUES ($1, $2)`;
    client.query(query,body,function(err,result){
        if (err) {
            res.status(400).send(err);
        }
        res.send(`${result.rowCount} insertion successful`);
    })
})

app.get("/products",function(req,res,next){
    let query = `SELECT * FROM products`;
    client.query(query,function(err,result){
        if(err){
            res.status(400).send(err);
        }
        res.send(result.rows);
    });
})

app.get("/products/:id",function(req,res,next){
    let id = req.params.id
    let query = `SELECT * FROM products WHERE productid= $1`;
    client.query(query,[id],function(err,result){
        if(err){
            res.status(400).send(err);
        }
        res.send(result.rows);
    });
})

app.post("/products",function(req, res, next){
    let body = Object.values(req.body);
    let query = `INSERT INTO products(productname,category,description) VALUES ($1, $2, $3)`;
    client.query(query,body,function(err,result){
        if (err) {
            res.status(400).send(err);
        }
        res.send(`${result.rowCount} insertion successful`);
    })
})

app.put("/products/:id",function(req,res){
    let id = req.params.id; 
    let body = Object.values(req.body);
    body.push(id)
    console.log(body);
    let query = `UPDATE products SET productid=$1, productname=$2, category= $3, description= $4  WHERE productid= $5`;
    client.query(query,body,function(err,result){
        if(err){
            res.status(400).send(err);
        }
        res.send(`${result.rowCount} updation successful`);
    })
});

app.get("/purchases/reset", function (req, res, next) {
    let query1 = "DELETE FROM purchases";
    client.query(query1, function (err, result) {
        if (err) {
            res.status(400).send(err);
        } else {
            let arr = data.map((s) => [s.shopId, s.productid, s.quantity, s.price]);
            let query = `INSERT INTO purchases(shopid, productid, quantity, price) VALUES `;
            let str = arr.reduce((acc, cur, index) => acc ? acc + `, $${index + 1}` : acc + ` $${index + 1}`, "");
            query += `${str}`;
            console.log(arr);
            client.query(query, [arr], function (err1, result1) {
                if (err1) {
                    res.status(400).send(err1);
                } else {
                    res.send(`${result1.rowCount} inserted successfully`);
                }
            });            
        }
    });
});


app.get("/purchases", function (req, res, next) {
    let { product = "", shop = "" } = req.query;
    if (product || shop) {
        let query1 = "SELECT * FROM purchases WHERE ";
        let str = "";

        if (product) {
            let ar = product.split(",");
            ar = ar.map((ele)=> ele[2] );
            str += `productid IN (${ar})`;
        }

        if (shop) {
            shop = shop[2];
            str += str ? ` AND shopid IN (${shop}) ` : ` shopid IN (${shop})`;
        }

        query1 += str;

        console.log(query1);

        client.query(query1, function (err, result) {
            if (err) {
                res.status(400).send(err);
            }
            res.send(result.rows);
        });
    } else {
        let query = `SELECT * FROM purchases`;
        client.query(query, function (err, result) {
            if (err) {
                res.status(400).send(err);
            }
            res.send(result.rows);
        });
    }
});

app.get("/parchases/shop/:id",function(req,res,next){
    let id = req.params.id;
    let query = `SELECT *FROM Purchases WHERE Purchases.ShopId = $1`;
    client.query(query,[id],function(err,result){
        if (err) {
            res.status(400).send(err);
        }
        res.send(result.rows);
    })
})

app.get("/parchases/product/:id",function(req,res,next){
    let id = req.params.id;
    let query = `SELECT * FROM Purchases WHERE Purchases.ProductId = $1`;
    client.query(query,[id],function(err,result){
        if (err) {
            res.status(400).send(err);
        }
        res.send(result.rows);
    });
});

app.get("/totalPurchase/shop/:id", function (req, res, next) {
    let id = req.params.id;
    let query = `SELECT MAX(Purchases.PurchaseId) AS PurchaseId,
                 Purchases.ProductId,
                Purchases.ShopId,
                SUM(Purchases.Quantity) AS Quantity ,MAX(Purchases.Price) AS Price
                FROM Purchases Where
                Purchases.ShopId = $1
                GROUP BY
                Purchases.ProductId,Purchases.ShopId`;
    client.query(query, [id], function (err, result) {
        if (err) {
            res.status(400).send(err);
        }
        res.send(result.rows);
    });
});

app.get("/totalPurchase/product/:id", function (req, res, next) {
    let id = req.params.id;
    let query = `SELECT MAX(Purchases.PurchaseId) AS PurchaseId,
                Purchases.ProductId,
                Purchases.ShopId,
                SUM(Purchases.Quantity) AS Quantity ,MAX(Purchases.Price) AS Price
                FROM Purchases Where
                Purchases.ProductId = $1
                GROUP BY
                Purchases.ProductId,Purchases.ShopId
    `;
    client.query(query, [id], function (err, result) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.send(result.rows);
        }
    });
});



app.post("/purchases", function (req, res, next) {
    let body = Object.values(req.body);
    let query = `INSERT INTO purchases(shopid, productid, quantity, price) VALUES ($1, $2, $3, $4)`;
    client.query(query, body, function (err, result) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.send(`${result.rowCount} insertion successful`);
        }
    });
});
